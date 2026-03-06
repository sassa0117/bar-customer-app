import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Colors } from "@/constants/Colors";
import { useCustomerStore } from "@/store/useCustomerStore";
import { useRouter } from "expo-router";

export default function CustomersScreen() {
  const { customers, loading, loadCustomers } = useCustomerStore();
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.includes(search) ||
      (c.nameKana && c.nameKana.includes(search))
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <FontAwesome name="search" size={14} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="名前で検索..."
            placeholderTextColor={Colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(tabs)/settings/customer-edit")}
        >
          <FontAwesome name="plus" size={16} color={Colors.text.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/settings/customer-edit",
                params: { id: item.id },
              })
            }
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, item.isMember && styles.avatarMember]}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.nameKana && (
                <Text style={styles.kana}>{item.nameKana}</Text>
              )}
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: item.isMember ? Colors.accent.goldLight : Colors.bg.card },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: item.isMember ? Colors.accent.gold : Colors.text.tertiary },
                ]}
              >
                {item.isMember ? "会員" : "一般"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? "読み込み中..." : "顧客がいません"}
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
  searchRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    paddingVertical: 10,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.red,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.secondary,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarMember: {
    backgroundColor: Colors.accent.goldLight,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  kana: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
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
