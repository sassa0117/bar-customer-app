import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useVisitStore, SlipWithTotal } from "@/store/useVisitStore";
import { useMenuStore } from "@/store/useMenuStore";
import { formatCurrency, formatTime, calcDurationMinutes, formatDuration, formatDateJP } from "@/lib/utils";

export default function DashboardScreen() {
  const router = useRouter();
  const {
    todayVisit,
    todayEvents,
    slips,
    loading,
    loadTodayVisit,
    setDayType,
    addVisitEvent,
    removeVisitEvent,
    closeVisit,
  } = useVisitStore();
  const { events, loadEvents } = useMenuStore();
  const [showEventPicker, setShowEventPicker] = useState(false);

  useEffect(() => {
    loadTodayVisit();
    loadEvents();
  }, []);

  const openSlips = slips.filter((s) => s.status === "open");
  const closedSlips = slips.filter((s) => s.status === "closed");
  const totalRevenue = slips.reduce((sum, s) => sum + s.total, 0);
  const customerCount = slips.length;
  const avgSpend = customerCount > 0 ? Math.round(totalRevenue / customerCount) : 0;

  const handleDayTypeToggle = () => {
    if (!todayVisit) return;
    if (todayVisit.dayType === "normal") {
      setShowEventPicker(true);
    } else {
      setDayType("normal");
      setShowEventPicker(false);
    }
  };

  const handleSelectEvent = (eventId: string) => {
    addVisitEvent(eventId);
  };

  const handleRemoveEvent = (visitEventId: string) => {
    removeVisitEvent(visitEventId);
  };

  const handleCloseVisit = () => {
    const openCount = openSlips.length;
    Alert.alert(
      "営業終了",
      openCount > 0
        ? `未会計の伝票が${openCount}件あります。全て会計して営業を終了しますか？`
        : "本日の営業を終了しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        { text: "終了する", style: "destructive", onPress: () => closeVisit() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>
            {todayVisit ? formatDateJP(todayVisit.date) : ""}
          </Text>
          <View style={styles.dayTypeRow}>
            <TouchableOpacity
              style={[
                styles.dayTypeBtn,
                todayVisit?.dayType === "normal" && styles.dayTypeBtnActive,
              ]}
              onPress={() => setDayType("normal")}
            >
              <Text
                style={[
                  styles.dayTypeText,
                  todayVisit?.dayType === "normal" && styles.dayTypeTextActive,
                ]}
              >
                通常営業
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dayTypeBtn,
                todayVisit?.dayType === "event" && styles.dayTypeBtnEvent,
              ]}
              onPress={handleDayTypeToggle}
            >
              <Text
                style={[
                  styles.dayTypeText,
                  todayVisit?.dayType === "event" && styles.dayTypeTextEvent,
                ]}
              >
                イベント
              </Text>
            </TouchableOpacity>
          </View>
          {todayEvents.length > 0 && (
            <View style={styles.eventTagsRow}>
              {todayEvents.map((ve) => (
                <View key={ve.id} style={styles.eventTag}>
                  <Text style={styles.eventTagText}>{ve.eventName}</Text>
                  {!todayVisit?.isClosed && (
                    <TouchableOpacity onPress={() => handleRemoveEvent(ve.id)} hitSlop={8}>
                      <FontAwesome name="times" size={11} color={Colors.accent.purple} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        {todayVisit?.isClosed && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>営業終了</Text>
          </View>
        )}
      </View>

      {/* Event Picker */}
      {showEventPicker && (
        <View style={styles.eventPicker}>
          {events
            .filter((evt) => !todayEvents.some((ve) => ve.eventId === evt.id))
            .map((evt) => (
              <TouchableOpacity
                key={evt.id}
                style={styles.eventPickerItem}
                onPress={() => handleSelectEvent(evt.id)}
              >
                <FontAwesome name="calendar" size={14} color={Colors.accent.purple} />
                <Text style={styles.eventPickerText}>{evt.name}</Text>
              </TouchableOpacity>
            ))}
          {events.filter((evt) => !todayEvents.some((ve) => ve.eventId === evt.id)).length === 0 && (
            <Text style={styles.eventPickerEmpty}>全てのイベントが追加済みです</Text>
          )}
          <TouchableOpacity
            style={styles.eventPickerClose}
            onPress={() => setShowEventPicker(false)}
          >
            <Text style={styles.eventPickerCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.summaryLabel}>売上</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{customerCount}名</Text>
          <Text style={styles.summaryLabel}>客数</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(avgSpend)}</Text>
          <Text style={styles.summaryLabel}>客単価</Text>
        </View>
      </View>

      {/* Slips */}
      <ScrollView style={styles.slipList}>
        {openSlips.length > 0 && (
          <Text style={styles.sectionLabel}>
            会計中 ({openSlips.length})
          </Text>
        )}
        {openSlips.map((slip) => (
          <SlipCard key={slip.id} slip={slip} onPress={() => router.push(`/slip/${slip.id}`)} />
        ))}
        {closedSlips.length > 0 && (
          <Text style={styles.sectionLabel}>
            会計済 ({closedSlips.length})
          </Text>
        )}
        {closedSlips.map((slip) => (
          <SlipCard key={slip.id} slip={slip} onPress={() => router.push(`/slip/${slip.id}`)} />
        ))}
        {slips.length === 0 && !loading && (
          <View style={styles.empty}>
            <FontAwesome name="glass" size={40} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>まだ伝票がありません</Text>
            <Text style={styles.emptySubtext}>下のボタンから顧客を追加してください</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {!todayVisit?.isClosed && (
          <>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push("/customer-select")}
            >
              <FontAwesome name="plus" size={20} color={Colors.text.white} />
              <Text style={styles.addBtnText}>顧客を追加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseVisit}>
              <FontAwesome name="power-off" size={16} color={Colors.accent.red} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function SlipCard({ slip, onPress }: { slip: SlipWithTotal; onPress: () => void }) {
  const isOpen = slip.status === "open";
  const now = new Date();
  const durationMin = slip.openedAt
    ? calcDurationMinutes(new Date(slip.openedAt), slip.closedAt ? new Date(slip.closedAt) : now)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.slipCard, !isOpen && styles.slipCardClosed]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.slipLeft}>
        <View style={[styles.slipAvatar, slip.isMember && styles.slipAvatarMember]}>
          <Text style={styles.slipAvatarText}>{slip.customerName.charAt(0)}</Text>
        </View>
        <View>
          <View style={styles.slipNameRow}>
            <Text style={styles.slipName}>{slip.customerName}</Text>
            {slip.isMember && (
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>会員</Text>
              </View>
            )}
          </View>
          <Text style={styles.slipMeta}>
            {slip.itemCount}品 ・ {formatDuration(durationMin)}
          </Text>
        </View>
      </View>
      <View style={styles.slipRight}>
        <Text style={[styles.slipTotal, !isOpen && styles.slipTotalClosed]}>
          {formatCurrency(slip.total)}
        </Text>
        {isOpen ? (
          <View style={styles.statusBadgeOpen}>
            <Text style={styles.statusBadgeOpenText}>会計中</Text>
          </View>
        ) : (
          <View style={styles.statusBadgeClosed}>
            <Text style={styles.statusBadgeClosedText}>会計済</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingTop: 60,
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  dayTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  dayTypeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayTypeBtnActive: {
    backgroundColor: Colors.accent.blueLight,
    borderColor: Colors.accent.blue,
  },
  dayTypeBtnEvent: {
    backgroundColor: Colors.accent.purpleLight,
    borderColor: Colors.accent.purple,
  },
  dayTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  dayTypeTextActive: {
    color: Colors.accent.blue,
  },
  dayTypeTextEvent: {
    color: Colors.accent.purple,
  },
  eventTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  eventTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent.purpleLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.accent.purple,
  },
  closedBadge: {
    backgroundColor: Colors.accent.greenLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closedBadgeText: {
    color: Colors.accent.green,
    fontWeight: "700",
    fontSize: 12,
  },
  eventPicker: {
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  eventPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.bg.input,
    borderRadius: 8,
  },
  eventPickerText: {
    color: Colors.text.primary,
    fontSize: 14,
  },
  eventPickerEmpty: {
    color: Colors.text.tertiary,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
  eventPickerClose: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 4,
  },
  eventPickerCloseText: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  slipList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  slipCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bg.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slipCardClosed: {
    opacity: 0.6,
  },
  slipLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  slipAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  slipAvatarMember: {
    backgroundColor: Colors.accent.goldLight,
  },
  slipAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  slipNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  slipName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  memberBadge: {
    backgroundColor: Colors.accent.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  slipMeta: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  slipRight: {
    alignItems: "flex-end",
  },
  slipTotal: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  slipTotalClosed: {
    color: Colors.accent.green,
  },
  statusBadgeOpen: {
    backgroundColor: Colors.accent.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusBadgeOpenText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent.blue,
  },
  statusBadgeClosed: {
    backgroundColor: Colors.accent.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusBadgeClosedText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent.green,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.text.tertiary,
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
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.red,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  addBtnText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.accent.red,
    alignItems: "center",
    justifyContent: "center",
  },
});
