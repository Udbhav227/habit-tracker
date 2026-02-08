import { Models } from "react-native-appwrite";

export interface Habit extends Models.Document {
  user_id: string;
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  streak_count: number;
  last_completed: string | null;
}