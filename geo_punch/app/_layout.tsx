import { Stack } from "expo-router";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const appTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.light.background, card: "#ffffff" },
};

function RootLayoutNav() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator color="#0f766e" size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={appTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={token === null}>
          <Stack.Screen name="(auth)/login" />
        </Stack.Protected>
        <Stack.Protected guard={token !== null}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}
