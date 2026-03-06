import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useMenuStore } from "@/store/useMenuStore";
import { db } from "@/db/client";
import { barMenuItems } from "@/db/schema";
import { eq } from "drizzle-orm";

const CATEGORIES = [
  { key: "drink", label: "ドリンク", color: Colors.category.drink },
  { key: "food", label: "フード", color: Colors.category.food },
  { key: "other", label: "その他", color: Colors.category.other },
];

export default function MenuEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { addMenuItem, updateMenuItem, toggleMenuItemActive } = useMenuStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("drink");
  const [price, setPrice] = useState("");
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      (async () => {
        const rows = await db.select().from(barMenuItems).where(eq(barMenuItems.id, id));
        if (rows[0]) {
          setName(rows[0].name);
          setCategory(rows[0].category);
          setPrice(String(rows[0].price));
        }
      })();
    }
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("エラー", "商品名を入力してください");
      return;
    }
    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert("エラー", "正しい金額を入力してください");
      return;
    }
    if (isEdit) {
      await updateMenuItem(id!, { name: name.trim(), category, price: priceNum });
    } else {
      await addMenuItem({ name: name.trim(), category, price: priceNum });
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("確認", "このメニューを無効にしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "無効にする",
        style: "destructive",
        onPress: async () => {
          await toggleMenuItemActive(id!);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>商品名 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="例: 生ビール"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>カテゴリ</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catBtn,
                category === cat.key && { backgroundColor: cat.color + "22", borderColor: cat.color },
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <View style={[styles.catDot, { backgroundColor: cat.color }]} />
              <Text
                style={[
                  styles.catText,
                  category === cat.key && { color: cat.color },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>価格 (円) *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="例: 600"
          placeholderTextColor={Colors.text.tertiary}
          keyboardType="number-pad"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{isEdit ? "更新" : "追加"}</Text>
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>無効にする</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bg.input,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catRow: {
    flexDirection: "row",
    gap: 10,
  },
  catBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  saveBtn: {
    backgroundColor: Colors.accent.red,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.accent.red,
  },
  deleteBtnText: {
    color: Colors.accent.red,
    fontSize: 16,
    fontWeight: "600",
  },
});
