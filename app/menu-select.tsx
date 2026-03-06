import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/Colors";
import { useMenuStore } from "@/store/useMenuStore";
import { useVisitStore } from "@/store/useVisitStore";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "すべて" },
  { key: "drink", label: "ドリンク", color: Colors.category.drink },
  { key: "food", label: "フード", color: Colors.category.food },
  { key: "other", label: "その他", color: Colors.category.other },
];

export default function MenuSelectScreen() {
  const { slipId } = useLocalSearchParams<{ slipId: string }>();
  const router = useRouter();
  const { menuItems, loadMenuItems } = useMenuStore();
  const { addItem } = useVisitStore();
  const [category, setCategory] = useState("all");
  const [stayMode, setStayMode] = useState(true);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const filtered =
    category === "all"
      ? menuItems
      : menuItems.filter((m) => m.category === category);

  const handleSelect = async (menuItemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addItem(slipId, menuItemId);
    if (!stayMode) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.tabRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.tab,
              category === cat.key && {
                backgroundColor: (cat.color || Colors.accent.red) + "22",
                borderColor: cat.color || Colors.accent.red,
              },
            ]}
            onPress={() => setCategory(cat.key)}
          >
            <Text
              style={[
                styles.tabText,
                category === cat.key && { color: cat.color || Colors.accent.red },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stay Mode Toggle */}
      <TouchableOpacity
        style={styles.stayToggle}
        onPress={() => setStayMode(!stayMode)}
      >
        <FontAwesome
          name={stayMode ? "check-square-o" : "square-o"}
          size={16}
          color={stayMode ? Colors.accent.blue : Colors.text.tertiary}
        />
        <Text style={[styles.stayText, stayMode && { color: Colors.accent.blue }]}>
          連続追加モード
        </Text>
      </TouchableOpacity>

      {/* Menu Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect(item.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.catIndicator,
                { backgroundColor: Colors.category[item.category as keyof typeof Colors.category] || Colors.text.tertiary },
              ]}
            />
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>メニューがありません</Text>
          </View>
        }
      />

      {stayMode && (
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>完了</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  tabRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  stayToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  stayText: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  grid: {
    paddingHorizontal: 8,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
    margin: 4,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
  },
  catIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    top: 10,
    right: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  doneBtn: {
    backgroundColor: Colors.accent.red,
    margin: 16,
    marginBottom: 32,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneBtnText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
