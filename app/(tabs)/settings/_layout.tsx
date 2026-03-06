import { Stack } from "expo-router";
import { Colors } from "@/constants/Colors";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg.primary },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: Colors.bg.primary },
      }}
    >
      <Stack.Screen name="index" options={{ title: "設定" }} />
      <Stack.Screen name="customers" options={{ title: "顧客管理" }} />
      <Stack.Screen name="customer-edit" options={{ title: "顧客編集" }} />
      <Stack.Screen name="menu-items" options={{ title: "メニュー管理" }} />
      <Stack.Screen name="menu-edit" options={{ title: "メニュー編集" }} />
      <Stack.Screen name="events" options={{ title: "イベント管理" }} />
    </Stack>
  );
}
