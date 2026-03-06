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
import { useCustomerStore } from "@/store/useCustomerStore";
import { db } from "@/db/client";
import { barCustomers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default function CustomerEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { addCustomer, updateCustomer, toggleActive } = useCustomerStore();

  const [name, setName] = useState("");
  const [nameKana, setNameKana] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [memo, setMemo] = useState("");
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      (async () => {
        const rows = await db.select().from(barCustomers).where(eq(barCustomers.id, id));
        if (rows[0]) {
          setName(rows[0].name);
          setNameKana(rows[0].nameKana || "");
          setIsMember(rows[0].isMember);
          setMemo(rows[0].memo || "");
        }
      })();
    }
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("エラー", "名前を入力してください");
      return;
    }
    if (isEdit) {
      await updateCustomer(id!, { name: name.trim(), nameKana: nameKana.trim() || undefined, isMember, memo: memo.trim() || undefined });
    } else {
      await addCustomer({ name: name.trim(), nameKana: nameKana.trim() || undefined, isMember, memo: memo.trim() || undefined });
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("確認", "この顧客を無効にしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "無効にする",
        style: "destructive",
        onPress: async () => {
          await toggleActive(id!);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>名前 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="例: 田中太郎"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>かな</Text>
        <TextInput
          style={styles.input}
          value={nameKana}
          onChangeText={setNameKana}
          placeholder="例: たなかたろう"
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>会員区分</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, isMember && styles.toggleActive]}
            onPress={() => setIsMember(true)}
          >
            <Text style={[styles.toggleText, isMember && styles.toggleTextActive]}>会員</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isMember && styles.toggleActive]}
            onPress={() => setIsMember(false)}
          >
            <Text style={[styles.toggleText, !isMember && styles.toggleTextActive]}>一般</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>メモ</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={memo}
          onChangeText={setMemo}
          placeholder="備考..."
          placeholderTextColor={Colors.text.tertiary}
          multiline
          numberOfLines={3}
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.bg.input,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleActive: {
    backgroundColor: Colors.accent.redLight,
    borderColor: Colors.accent.red,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  toggleTextActive: {
    color: Colors.accent.red,
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
