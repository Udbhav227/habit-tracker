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
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { ActivityIndicator, Surface, Text } from "react-native-paper";

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
  gold: "#FFD700",
  goldSoft: "#FFF9C4",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

export default function StreaksScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const truncate = (text: string, max = 40) =>
    text.length > max ? `${text.slice(0, max)}…` : text;

  useEffect(() => {
    if (user) {
      const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
      const habitsSubscription = client.subscribe(
        habitsChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.some((e) =>
              e.includes("databases.*.collections.*.documents"),
            )
          ) {
            fetchHabits();
          }
        },
      );

      const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
      const completionsSubscription = client.subscribe(
        completionsChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create",
            )
          ) {
            fetchCompletions();
          }
        },
      );

      fetchHabits();
      fetchCompletions();

      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user]);

  const fetchHabits = async () => {
    if (!DATABASE_ID || !HABITS_COLLECTION_ID || !user?.$id) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")],
      );
      setHabits(response.documents as unknown as Habit[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletions = async () => {
    if (!DATABASE_ID || !COMPLETIONS_COLLECTION_ID || !user?.$id) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")],
      );
      const completions = response.documents as unknown as HabitCompletion[];
      setCompletedHabits(completions);
    } catch (error) {
      console.error(error);
    }
  };

  interface StreakData {
    streak: number;
    bestStreak: number;
    total: number;
  }

  const getStreakData = (habitId: string): StreakData => {
    const habitCompletions = completedHabits
      ?.filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime(),
      );

    if (habitCompletions?.length === 0) {
      return { streak: 0, bestStreak: 0, total: 0 };
    }

    let streak = 0;
    let bestStreak = 0;
    let total = habitCompletions.length;
    let lastDate: Date | null = null;
    let currentStreak = 0;

    habitCompletions?.forEach((c) => {
      const date = new Date(c.completed_at);
      if (lastDate) {
        const diff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > bestStreak) bestStreak = currentStreak;
      streak = currentStreak;
      lastDate = date;
    });

    return { streak, bestStreak, total };
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, bestStreak, streak, total };
  });

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);

  const getRankColor = (index: number) => {
    if (index === 0) return colors.gold;
    if (index === 1) return colors.silver;
    if (index === 2) return colors.bronze;
    return colors.accentSoft;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Habit Streaks
        </Text>
      </View>

      {loading && habits.length === 0 ? (
        <ActivityIndicator animating={true} style={{ marginTop: 50 }} />
      ) : habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No habits yet. Add your first Habit!
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {rankedHabits.length > 0 && (
            <Surface style={styles.rankingCard} elevation={2}>
              <View style={styles.rankingHeader}>
                <MaterialCommunityIcons
                  name="medal-outline"
                  size={24}
                  color={colors.streak}
                />
                <Text style={styles.rankingTitle}>Top Streaks</Text>
              </View>

              {rankedHabits.slice(0, 3).map((item, index) => (
                <View
                  key={item.habit.$id}
                  style={[
                    styles.rankingRow,
                    index !== 2 && styles.rankingBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: getRankColor(index) },
                    ]}
                  >
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.rankHabitName}>{item.habit.title}</Text>
                  <View style={styles.rankScore}>
                    <Text style={styles.rankScoreText}>{item.bestStreak}</Text>
                    <MaterialCommunityIcons
                      name="fire"
                      size={14}
                      color={colors.streak}
                    />
                  </View>
                </View>
              ))}
            </Surface>
          )}

          {rankedHabits.map(({ habit, streak, bestStreak, total }) => (
            <Surface key={habit.$id} style={styles.card} elevation={1}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{habit.title}</Text>
                {habit.description ? (
                  <Text style={styles.cardDesc} numberOfLines={1}>
                    {truncate(habit.description)}
                  </Text>
                ) : null}

                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <View style={styles.iconCircle}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={20}
                        color={colors.streak}
                      />
                    </View>
                    <View>
                      <Text style={styles.statValue}>{streak}</Text>
                      <Text style={styles.statLabel}>Current</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statBox}>
                    <View style={[styles.iconCircle, styles.goldCircle]}>
                      <MaterialCommunityIcons
                        name="trophy-variant"
                        size={20}
                        color="#B78900"
                      />
                    </View>
                    <View>
                      <Text style={styles.statValue}>{bestStreak}</Text>
                      <Text style={styles.statLabel}>Best</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statBox}>
                    <View style={[styles.iconCircle, styles.greenCircle]}>
                      <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={20}
                        color={colors.success}
                      />
                    </View>
                    <View>
                      <Text style={styles.statValue}>{total}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Surface>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  rankingCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rankingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginLeft: 8,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rankingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  rankHabitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rankScore: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankScoreText: {
    fontWeight: "800",
    color: colors.streak,
    marginRight: 4,
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 12,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  goldCircle: {
    backgroundColor: colors.goldSoft,
  },
  greenCircle: {
    backgroundColor: colors.successSoft,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 8,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
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
});
