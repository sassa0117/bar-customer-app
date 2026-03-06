import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/Colors";
import { useCustomerStore } from "@/store/useCustomerStore";
import { useVisitStore } from "@/store/useVisitStore";

export default function CustomerSelectScreen() {
  const router = useRouter();
  const { customers, loadCustomers } = useCustomerStore();
  const { openSlip, slips } = useVisitStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter out customers who already have an open slip today
  const activeCustomerIds = new Set(
    slips.filter((s) => s.status === "open").map((s) => s.customerId)
  );

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.includes(search) ||
      (c.nameKana && c.nameKana.includes(search));
    return matchesSearch;
  });

  // Sort: members first, then by name
  const sorted = [...filtered].sort((a, b) => {
    if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
    return (a.nameKana || a.name).localeCompare(b.nameKana || b.name);
  });

  const handleSelect = async (customerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const slipId = await openSlip(customerId);
    router.replace(`/slip/${slipId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={14} color={Colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="名前・かなで検索..."
          placeholderTextColor={Colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <FontAwesome name="times-circle" size={16} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const hasOpenSlip = activeCustomerIds.has(item.id);
          return (
            <TouchableOpacity
              style={[styles.card, hasOpenSlip && styles.cardDisabled]}
              onPress={() => !hasOpenSlip && handleSelect(item.id)}
              activeOpacity={hasOpenSlip ? 1 : 0.7}
            >
              <View style={[styles.avatar, item.isMember && styles.avatarMember]}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isMember && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>会員</Text>
                </View>
              )}
              {hasOpenSlip && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>来店中</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>顧客が見つかりません</Text>
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.input,
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    paddingVertical: 12,
  },
  grid: {
    paddingHorizontal: 12,
  },
  card: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.bg.secondary,
    margin: 4,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: "33%",
  },
  cardDisabled: {
    opacity: 0.4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bg.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarMember: {
    backgroundColor: Colors.accent.goldLight,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
  },
  badge: {
    backgroundColor: Colors.accent.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  activeBadge: {
    backgroundColor: Colors.accent.blueLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent.blue,
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
