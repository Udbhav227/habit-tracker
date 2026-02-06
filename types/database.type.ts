import { Models } from "react-native-appwrite";

export interface Habit extends Models.Document {
  user_id: string;
  description: string;
  frequency: string;
  streak_count: number;
  last_completed: string;
}