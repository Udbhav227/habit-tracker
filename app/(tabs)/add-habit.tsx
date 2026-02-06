import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { router, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];


export default function AddHabitScreen() {
  const [title, setTitle] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [freq, setFreq] = useState<Frequency>("daily");
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!user) return;

    await databases.createDocument(
      DATABASE_ID,
      HABITS_COLLECTION_ID,
      ID.unique(),
      {
        user_id: user.$id,
        title,
        desc,
        freq,
        streak_count: 0,
        last_completed: new Date().toISOString(),
        $createdAt: new Date().toISOString(),
      },
    );

    router.back()
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Title"
        mode="outlined"
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        label="Description"
        mode="outlined"
        onChangeText={setDesc}
        style={styles.input}
      />
      <View style={styles.freqContainer}>
        <SegmentedButtons
          value={freq}
          onValueChange={(value) => setFreq(value as Frequency)}
          buttons={FREQUENCIES.map((freq) => ({
            value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))}
        />
      </View>
      <Button mode="contained" onPress={handleSubmit} disabled={!title || !desc}>Add Habit</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  input: {
    marginBottom: 16,
  },
  freqContainer: {
    marginBottom: 24,
  },
});
