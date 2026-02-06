import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit } from "@/types/database.type";
import { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Button } from "react-native-paper";


export default function Index() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const { signOut, user } = useAuth();

  const fetchHabits = async () => {
    if (!DATABASE_ID || !HABITS_COLLECTION_ID || !user?.$id) return;

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user.$id)],
      );
      setHabits(response.documents as unknown as Habit[]);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user?.$id]);

  return (
    <>
      <View style={styles.view}>
        
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  navButton: {
    width: 200,
    height: 50,
    backgroundColor: "coral",
  },
});
