import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Colors } from "@/constants/Colors";
import { useMenuStore } from "@/store/useMenuStore";
import { useRouter } from "expo-router";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  drink: "ドリンク",
  food: "フード",
  other: "その他",
};

export default function MenuItemsScreen() {
  const { menuItems, loading, loadMenuItems } = useMenuStore();
  const router = useRouter();

  useEffect(() => {
    loadMenuItems();
  }, []);

  const sections = Object.entries(
    menuItems.reduce(
      (acc, item) => {
        const cat = item.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      },
      {} as Record<string, typeof menuItems>
    )
  ).map(([key, data]) => ({
    title: CATEGORY_LABELS[key] || key,
    data,
  }));

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/settings/menu-edit",
                params: { id: item.id },
              })
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.catDot,
                { backgroundColor: Colors.category[item.category as keyof typeof Colors.category] || Colors.text.tertiary },
              ]}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addCard}
            onPress={() => router.push("/(tabs)/settings/menu-edit")}
          >
            <FontAwesome name="plus-circle" size={20} color={Colors.accent.red} />
            <Text style={styles.addText}>メニューを追加</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? "読み込み中..." : "メニューがありません"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
    textTransform: "uppercase",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.secondary,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.redLight,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.accent.red,
    borderStyle: "dashed",
  },
  addText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.accent.red,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
});
