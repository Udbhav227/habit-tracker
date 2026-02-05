import React, { useEffect, useRef } from "react";
import {
  Platform,
  StyleSheet,
  View,
  Keyboard,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function AuthScreen() {
  const [isSignedUp, setIsSignedUp] = React.useState<boolean>(false);
  const shiftAnimation = useRef(new Animated.Value(0)).current;

  const handleSwitchMode = () => {
    setIsSignedUp((prev) => !prev);
  };

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
            secureTextEntry
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
    marginBottom: 16,
  },
  button: {
    textAlign: "center",
    marginBottom: 8,
  },
});
