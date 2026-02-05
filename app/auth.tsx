import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function AuthScreen() {
  const [isSignedUp, setIsSignedUp] = React.useState<boolean>(false);

  const handleSwitchMode = () => {
    setIsSignedUp((prev) => !prev);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title} variant="headlineMedium">
          {isSignedUp ? "Create Account" : "Welcome Back"}
        </Text>
        <TextInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Password"
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />

        <Button mode="contained" style={styles.button}>
          {isSignedUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button mode="text" onPress={handleSwitchMode} style={styles.button}>
          {isSignedUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 16,
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    textAlign: "center",
    marginBottom: 8,
  },
  switchModeButton: {
    marginTop: 16,
  }
});
