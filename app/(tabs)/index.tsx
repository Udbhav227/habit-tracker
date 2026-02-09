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
import { useEffect, useRef, useState } from "react";
import { FlatList, ListRenderItem, ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import { ActivityIndicator, Button, Surface, Text } from "react-native-paper";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

export default function Index() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const { signOut, user } = useAuth();
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map()); 
  
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // UX: Success feedback

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
          await databases.updateDocument(
            DATABASE_ID,
            HABITS_COLLECTION_ID,
            id,
            {
              streak_count: habit.streak_count + 1,
              last_completed: currentDate,
            },
          );
        }
      } catch (error) {
        console.error(error);
        fetchTodayCompletions();
        fetchHabits();
      }
    };

  const isHabitCompleted = (habitId: string) =>
    completedHabits?.includes(habitId);

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons name="trash-can-outline" size={32} color="#fff" />
    </View>
  );

  const renderRightActions = (id: string, isCompleted: boolean) => {
    return (
      <View
        style={[
          styles.swipeActionRight,
          isCompleted && { backgroundColor: "#81c784" },
        ]}
      >
        <MaterialCommunityIcons
          name={isCompleted ? "check-all" : "check"}
          size={32}
          color="#fff"
        />
      </View>
    );
  };

  const renderItem: ListRenderItem<Habit> = ({ item }) => {
    const isCompleted = completedHabits.includes(item.$id);

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
          renderRightActions={() => renderRightActions(item.$id, isCompleted)}
          onSwipeableWillOpen={() => {
            [...swipeableRefs.current.entries()].forEach(([key, ref]) => {
              if (key !== item.$id) ref?.close();
            });
          }}
          onSwipeableOpen={(direction) => {
            if (direction === "left") handleDeleteHabit(item.$id);
            else if (direction === "right") handleCompleteHabit(item.$id);
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
                <View style={styles.freqBadge}>
                  <Text style={styles.freqText}>
                    {item.frequency.charAt(0).toUpperCase() +
                      item.frequency.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        </Swipeable>
      </Animated.View>
    );
  }

  return (
    <GestureHandlerRootView>
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
            contentContainerStyle={{ paddingBottom: 100 }}
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
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  listContent: {
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    color: "#2d3436",
  },
  cardDesc: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 16,
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
    opacity: 0.8,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ff9800",
    marginLeft: 4,
  },
  freqBadge: {
    backgroundColor: "#f3e5f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freqText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7c4dff",
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
    backgroundColor: "#ff7675",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#00b894",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  },
});
