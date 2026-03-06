import { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/Colors";
import { useVisitStore } from "@/store/useVisitStore";
import { formatCurrency, formatTime, calcDurationMinutes, formatDuration } from "@/lib/utils";

export default function SlipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeSlip, loadSlipDetail, incrementItem, decrementItem, removeItem, closeSlip } =
    useVisitStore();

  useEffect(() => {
    if (id) loadSlipDetail(id);
  }, [id]);

  if (!activeSlip) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const isOpen = activeSlip.status === "open";
  const now = new Date();
  const durationMin = activeSlip.openedAt
    ? calcDurationMinutes(
        new Date(activeSlip.openedAt),
        activeSlip.closedAt ? new Date(activeSlip.closedAt) : now
      )
    : 0;

  const handleClose = () => {
    Alert.alert("会計確認", `合計 ${formatCurrency(activeSlip.total)} で会計しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "会計する",
        onPress: async () => {
          await closeSlip(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleIncrement = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementItem(itemId);
  };

  const handleDecrement = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    decrementItem(itemId);
  };

  const handleRemove = (itemId: string, name: string) => {
    Alert.alert("削除", `${name}を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => removeItem(itemId) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.customerName}>{activeSlip.customerName}</Text>
          <Text style={styles.meta}>
            {activeSlip.openedAt && formatTime(new Date(activeSlip.openedAt))} 〜{" "}
            {activeSlip.closedAt ? formatTime(new Date(activeSlip.closedAt)) : "現在"}
            {"  "}({formatDuration(durationMin)})
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalLabel}>合計</Text>
          <Text style={styles.totalAmount}>{formatCurrency(activeSlip.total)}</Text>
        </View>
      </View>

      {/* Items List */}
      <FlatList
        data={activeSlip.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.itemList}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.menuItemName}</Text>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.unitPrice)} x {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemSubtotal}>
              {formatCurrency(item.unitPrice * item.quantity)}
            </Text>
            {isOpen && (
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleDecrement(item.id)}
                >
                  <FontAwesome name="minus" size={12} color={Colors.accent.red} />
                </TouchableOpacity>
                <Text style={styles.stepperCount}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleIncrement(item.id)}
                >
                  <FontAwesome name="plus" size={12} color={Colors.accent.blue} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyItems}>
            <FontAwesome name="cutlery" size={30} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>まだ注文がありません</Text>
          </View>
        }
      />

      {/* Bottom Actions */}
      {isOpen && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.addItemBtn}
            onPress={() =>
              router.push({
                pathname: "/menu-select",
                params: { slipId: id },
              })
            }
          >
            <FontAwesome name="plus" size={16} color={Colors.text.white} />
            <Text style={styles.addItemBtnText}>注文追加</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeSlipBtn} onPress={handleClose}>
            <FontAwesome name="check" size={16} color={Colors.text.white} />
            <Text style={styles.closeSlipBtnText}>会計する</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isOpen && (
        <View style={styles.closedBar}>
          <FontAwesome name="check-circle" size={20} color={Colors.accent.green} />
          <Text style={styles.closedText}>会計済み</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  meta: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  itemList: {
    padding: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.secondary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  itemPrice: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.accent.gold,
    marginRight: 12,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg.input,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperCount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
    minWidth: 20,
    textAlign: "center",
  },
  emptyItems: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 32,
    gap: 10,
    backgroundColor: Colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addItemBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.blue,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  addItemBtnText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  },
  closeSlipBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.green,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  closeSlipBtnText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  },
  closedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    paddingBottom: 32,
    gap: 8,
    backgroundColor: Colors.accent.greenLight,
    borderTopWidth: 1,
    borderTopColor: Colors.accent.green,
  },
  closedText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.accent.green,
  },
});
