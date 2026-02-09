import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  RealtimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
  Animated as RNAnimated,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { ActivityIndicator, Button, Surface, Text } from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import ConfettiCannon from "react-native-confetti-cannon";

export default function Index() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const { signOut, user } = useAuth();
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const confettiRef = useRef<ConfettiCannon>(null);

  const fetchHabits = async () => {
    if (!DATABASE_ID || !HABITS_COLLECTION_ID || !user?.$id) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user.$id), Query.orderDesc("$createdAt")],
      );
      setHabits(response.documents as unknown as Habit[]);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayCompletions = async () => {
    if (!DATABASE_ID || !COMPLETIONS_COLLECTION_ID) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ],
      );
      const completions = response.documents as unknown as HabitCompletion[];
      setCompletedHabits(completions.map((c) => c.habit_id));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user?.$id) return;

    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;

    const handleRealtime = (response: RealtimeResponse) => {
      if (
        response.events.some(
          (e) =>
            e.includes("create") ||
            e.includes("update") ||
            e.includes("delete"),
        )
      ) {
        fetchHabits();
        if (response.channels.includes(completionsChannel))
          fetchTodayCompletions();
      }
    };

    const unsubscribe = client.subscribe(
      [habitsChannel, completionsChannel],
      handleRealtime,
    );

    fetchHabits();
    fetchTodayCompletions();

    return () => {
      unsubscribe();
    };
  }, [user?.$id]);

  const handleDeleteHabit = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    setHabits((current) => current.filter((h) => h.$id !== id));

    try {
      if (!DATABASE_ID || !HABITS_COLLECTION_ID) return;
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
    } catch (error) {
      console.error(error);
      fetchHabits();
    }
  };

  const handleCompleteHabit = async (id: string) => {
    if (completedHabits.includes(id)) return;

    confettiRef.current?.start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const currentDate = new Date().toISOString();
    setCompletedHabits((prev) => [...prev, id]);

    setHabits((current) =>
      current.map((h) =>
        h.$id === id ? { ...h, streak_count: h.streak_count + 1 } : h,
      ),
    );

    try {
      if (
        !DATABASE_ID ||
        !COMPLETIONS_COLLECTION_ID ||
        !HABITS_COLLECTION_ID ||
        !user?.$id
      )
        return;

      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        { habit_id: id, user_id: user.$id, completed_at: currentDate },
      );

      const habit = habits.find((h) => h.$id === id);
      if (habit) {
        await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
          streak_count: habit.streak_count + 1,
          last_completed: currentDate,
        });
      }
    } catch (error) {
      console.error(error);
      fetchTodayCompletions();
      fetchHabits();
    }
  };

  const renderLeftActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.5, 3],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.swipeActionLeft}>
        <RNAnimated.View style={{ transform: [{ scale }] }}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={32}
            color="#fff"
          />
        </RNAnimated.View>
      </View>
    );
  };

  const renderRightActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
    _dragX: RNAnimated.AnimatedInterpolation<number>,
    id: string,
    isCompleted: boolean,
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 3],
      extrapolate: "clamp",
    });

    return (
      <View
        style={[
          styles.swipeActionRight,
          isCompleted && { backgroundColor: "#81c784" },
        ]}
      >
        <RNAnimated.View style={{ transform: [{ scale }] }}>
          <MaterialCommunityIcons
            name={isCompleted ? "check-all" : "check"}
            size={32}
            color="#fff"
          />
        </RNAnimated.View>
      </View>
    );
  };

  const renderItem: ListRenderItem<Habit> = ({ item }) => {
    const isCompleted = completedHabits.includes(item.$id);
    const freqColor =
      item.frequency === "daily"
        ? colors.freqDaily
        : item.frequency === "weekly"
          ? colors.freqWeekly
          : colors.freqMonthly;

    return (
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutUp}
        layout={LinearTransition}
      >
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(item.$id, ref);
          }}
          renderLeftActions={renderLeftActions}
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, item.$id, isCompleted)
          }
          failOffsetY={[-5, 5]}
          activeOffsetX={[-20, 20]}
          onSwipeableWillOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          leftThreshold={80}
          rightThreshold={80}
          overshootLeft={false}
          overshootRight={false}
          friction={2}
          onSwipeableOpen={(direction) => {
            if (direction === "left") handleDeleteHabit(item.$id);
            if (direction === "right") handleCompleteHabit(item.$id);
            swipeableRefs.current.get(item.$id)?.close();
          }}
        >
          <Surface
            style={[styles.card, isCompleted && styles.cardCompleted]}
            elevation={1}
          >
            <View style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cardTitle,
                    isCompleted && {
                      textDecorationLine: "line-through",
                      color: "#999",
                    },
                  ]}
                >
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.cardDesc}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons
                    name="fire"
                    size={16}
                    color="#ff9800"
                  />
                  <Text style={styles.streakText}>{item.streak_count}</Text>
                </View>
                <View
                  style={[styles.freqBadge, { backgroundColor: freqColor }]}
                >
                  <Text style={styles.freqText}>
                    {item.frequency.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            My Habits
          </Text>
          <Button
            mode="text"
            onPress={signOut}
            icon="logout"
            textColor="#ff5252"
          >
            Sign Out
          </Button>
        </View>

        {loading && habits.length === 0 ? (
          <ActivityIndicator animating={true} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(item) => item.$id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingBottom: 120,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No habits yet. Add your first Habit!
                </Text>
              </View>
            }
          />
        )}
        <ConfettiCannon
          count={180}
          origin={{ x: -20, y: 0 }}
          autoStart={false}
          ref={confettiRef}
          fadeOut={true}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const colors = {
  bg: "#FFF7ED",
  card: "#FFFFFF",
  cardBorder: "#FFE4C7",
  textPrimary: "#3A2D28",
  textSecondary: "#7A5C52",
  accent: "#FF7A00",
  accentSoft: "#FFF0E0",
  success: "#4CAF50",
  successSoft: "#E8F7EC",
  danger: "#FF6B6B",
  streak: "#FF9800",
  freqDaily: "#6C5CE7",
  freqWeekly: "#00B894",
  freqMonthly: "#0984e3",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  listContent: {
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cardCompleted: {
    backgroundColor: "#F9FAFB",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.streak,
    marginLeft: 6,
  },
  freqBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  freqText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    marginTop: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "#b2bec3",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: colors.danger,
    borderRadius: 24,
    marginBottom: 18,
    paddingLeft: 24,
    marginTop: 2,
    width: 96,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: colors.success,
    borderRadius: 24,
    marginBottom: 18,
    paddingRight: 24,
    marginTop: 2,
    width: 96,
  },
});
