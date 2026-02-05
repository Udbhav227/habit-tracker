import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import React, { useEffect } from "react";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  const isAuth = false; // Replace with your actual auth logic later

  useEffect(() => {
    // 1. CRITICAL: If the navigation system isn't ready yet, DO NOTHING.
    // The .key property is undefined until the navigation is fully mounted.
    if (!rootNavigationState?.key) return;

    // 2. Identify where we are
    const inAuthGroup = segments[0] === "auth";

    // 3. Logic: Redirect if needed
    if (!isAuth && !inAuthGroup) {
      // 4. The "Hack": Wrap in setTimeout to push execution to the "next tick"
      // This ensures the <Stack> has finished mounting before we try to replace the route.
      const timer = setTimeout(() => {
        router.replace("/auth");
      }, 1);

      return () => clearTimeout(timer); // Cleanup
    } else if (isAuth && inAuthGroup) {
      const timer = setTimeout(() => {
        router.replace("/"); // or "/(tabs)"
      }, 1);

      return () => clearTimeout(timer);
    }
  }, [isAuth, segments, rootNavigationState?.key]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <RouteGuard>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    </RouteGuard>
  );
}
