import { StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.view}> </View>
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
