import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Colors } from "@/constants/Colors";
import { useMenuStore } from "@/store/useMenuStore";

export default function EventsScreen() {
  const { events, loadEvents, addEvent, updateEvent, toggleEventActive } = useMenuStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setShowModal(true);
  };

  const openEdit = (evt: (typeof events)[0]) => {
    setEditId(evt.id);
    setName(evt.name);
    setDescription(evt.description || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("エラー", "イベント名を入力してください");
      return;
    }
    if (editId) {
      await updateEvent(editId, { name: name.trim(), description: description.trim() || undefined });
    } else {
      await addEvent({ name: name.trim(), description: description.trim() || undefined });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("確認", "このイベントを無効にしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "無効にする",
        style: "destructive",
        onPress: () => toggleEventActive(id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addCard} onPress={openAdd}>
        <FontAwesome name="plus-circle" size={20} color={Colors.accent.red} />
        <Text style={styles.addText}>イベントを追加</Text>
      </TouchableOpacity>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openEdit(item)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <FontAwesome name="calendar" size={18} color={Colors.accent.purple} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description && (
                <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="trash-o" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>イベントがありません</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editId ? "イベント編集" : "イベント追加"}
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>イベント名 *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例: ワイン試飲会"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>説明</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="説明..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={3}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editId ? "更新" : "追加"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    padding: 16,
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.redLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.purpleLight,
    alignItems: "center",
    justifyContent: "center",
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
  desc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  field: {
    marginBottom: 16,
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
  saveBtn: {
    backgroundColor: Colors.accent.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
});
