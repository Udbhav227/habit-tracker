import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, TextInput, HelperText, Surface, Text } from "react-native-paper";
import * as Haptics from "expo-haptics";

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabitScreen() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [freq, setFreq] = useState<Frequency>("daily");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; general?: string }>({});

  const { user } = useAuth();
  const router = useRouter();

  const validate = () => {
    let valid = true;
    if (!title.trim()) {
      setErrors((prev) => ({ ...prev, title: "Habit name is required" }));
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!user || !validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    } 

    if (!DATABASE_ID || !HABITS_COLLECTION_ID) {
      setErrors({ general: "Database configuration missing. Check your environment variables." });
      return;
    }

    setLoading(true);
    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title: title.trim(),
          description: desc.trim(),
          frequency: freq,
          streak_count: 0,
          last_completed: null, 
        }
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle("");
      setDesc("");
      setFreq("daily");
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ general: error.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* General Error Banner */}
      {errors.general && (
        <Surface style={styles.errorBanner} elevation={1}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </Surface>
      )}

      <View style={styles.inputGroup}>
        <TextInput
          label="Habit Name"
          mode="outlined"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          error={!!errors.title}
          style={styles.input}
          disabled={loading}
        />
        <HelperText type="error" visible={!!errors.title}>
          {errors.title}
        </HelperText>
      </View>
      
      <TextInput
        label="Description (Optional)"
        mode="outlined"
        value={desc}
        onChangeText={setDesc}
        multiline
        numberOfLines={3}
        style={styles.input}
        disabled={loading}
      />

      <View style={styles.freqContainer}>
        <Text variant="labelLarge" style={styles.label}>Frequency</Text>
        <SegmentedButtons
          value={freq}
          onValueChange={(value) => setFreq(value as Frequency)}
          buttons={FREQUENCIES.map((f) => ({
            value: f,
            label: f.charAt(0).toUpperCase() + f.slice(1),
            disabled: loading
          }))}
        />
      </View>

      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        loading={loading}
        disabled={loading}
        contentStyle={styles.buttonInner}
        style={styles.submitBtn}
      >
        Create Habit
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  inputGroup: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
  },
  freqContainer: {
    marginVertical: 15,
  },
  label: {
    marginBottom: 8,
    color: "#666",
  },
  buttonInner: {
    paddingVertical: 6,
  },
  submitBtn: {
    marginTop: 10,
    marginBottom: 40,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#d32f2f",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  }
});