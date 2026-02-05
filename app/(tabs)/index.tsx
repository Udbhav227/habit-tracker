import { StyleSheet, View, Text } from "react-native";

export default function Index() {
  return (
    <View style={styles.view}><Text>asdf</Text></View>
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
    backgroundColor: "crimson",
  },
});
