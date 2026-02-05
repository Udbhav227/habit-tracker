import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <>
      <Tabs screenOptions={{ tabBarActiveTintColor: "coral" }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => {
              return focused ? (
                <FontAwesome5 name="home" size={24} color={color} />
              ) : (
                <FontAwesome5 name="home" size={24} color={"black"} />
              );
            },
          }}
        />
        <Tabs.Screen name="login" options={{ title: "Login" }} />
      </Tabs>
    </>
  );
}
