import { AuthProvider, useAuth } from "@/lib/auth-context"
import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";
import React, { useEffect } from "react";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoadingUser } = useAuth();

  useEffect(() => {
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup && !isLoadingUser) {
      router.replace("/auth")
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, segments])

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
      </RouteGuard>
    </AuthProvider>
  );
}
