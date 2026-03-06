import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Colors } from "@/constants/Colors";

const menuItems = [
  { title: "顧客管理", icon: "users" as const, route: "/(tabs)/settings/customers" as const, desc: "会員・一般客の登録・編集" },
  { title: "メニュー管理", icon: "cutlery" as const, route: "/(tabs)/settings/menu-items" as const, desc: "ドリンク・フードの登録・編集" },
  { title: "イベント管理", icon: "calendar" as const, route: "/(tabs)/settings/events" as const, desc: "イベントの登録・編集" },
];

export default function SettingsIndex() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={styles.card}
          onPress={() => router.push(item.route)}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <FontAwesome name={item.icon} size={20} color={Colors.accent.red} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={Colors.text.tertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    padding: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.redLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  desc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
