import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function AuthScreen() {
  const [isSignedUp, setIsSignedUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");

  const theme = useTheme();
  const shiftAnimation = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSwitchMode = () => {
    setIsSignedUp((prev) => !prev);
    setError(null);
    setEmail("");
    setPassword("");
  };

  const handleAuth = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all the fields.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignedUp) {
      const error = await signUp(email, password);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }
    }

    router.replace("/")
    console.log("Validation Passed. Submitting...", { email, password });
  };

  // Shift animation logic
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onKeyboardShow = (event: any) => {
      Animated.timing(shiftAnimation, {
        toValue: -120,
        duration: Platform.OS === "ios" ? event.duration : 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    };

    const onKeyboardHide = (event: any) => {
      Animated.timing(shiftAnimation, {
        toValue: 0,
        duration: Platform.OS === "ios" ? event.duration : 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [shiftAnimation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            { transform: [{ translateY: shiftAnimation }] },
          ]}
        >
          <Text style={styles.title} variant="headlineMedium">
            {isSignedUp ? "Create Account" : "Welcome Back!"}
          </Text>

          <TextInput
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="example@gmail.com"
            mode="outlined"
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            error={!!error && !isValidEmail(email) && email.length > 0}
          />

          <TextInput
            label="Password"
            autoCapitalize="none"
            secureTextEntry
            mode="outlined"
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            error={!!error && password.length > 0 && password.length < 6}
          />

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          <Button mode="contained" style={styles.button} onPress={handleAuth}>
            {isSignedUp ? "Sign Up" : "Sign In"}
          </Button>

          <Button mode="text" onPress={handleSwitchMode} style={styles.button}>
            {isSignedUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    justifyContent: "center",
  },
  content: {
    backgroundColor: "#f5f5f5",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    textAlign: "center",
    marginTop: 8,
  },
});
