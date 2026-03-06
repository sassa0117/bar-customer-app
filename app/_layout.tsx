import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";
import { runMigrations } from "@/db/migrations";
import { seedDatabase } from "@/db/seed";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function initDb() {
      try {
        await runMigrations();
        await seedDatabase();
        setDbReady(true);
      } catch (e: any) {
        console.error("DB init error:", e);
        setDbError(e?.message ?? String(e));
        setDbReady(true);
      }
    }
    initDb();
  }, []);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>DB Error: {dbError}</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg.primary },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: Colors.bg.primary },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="customer-select"
        options={{
          title: "顧客を選択",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="menu-select"
        options={{
          title: "メニューを選択",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="slip/[id]"
        options={{
          title: "伝票",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg.primary,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    padding: 20,
    textAlign: "center",
  },
});
