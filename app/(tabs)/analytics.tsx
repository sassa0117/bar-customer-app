import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Colors } from "@/constants/Colors";
import { db } from "@/db/client";
import { barVisits, barSlips, barSlipItems, barMenuItems, barCustomers, barEvents } from "@/db/schema";
import { sql, eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { formatCurrency, formatDuration } from "@/lib/utils";

type Period = "week" | "month" | "lastMonth" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  week: "今週",
  month: "今月",
  lastMonth: "先月",
  all: "全期間",
};

type DailyStat = { date: string; revenue: number; customers: number };
type EventStat = { eventId: string; eventName: string; revenue: number; customers: number; avgSpend: number };
type CustomerRank = { customerId: string; name: string; visits: number; totalSpend: number; isMember: boolean };
type MenuRank = { menuItemId: string; name: string; quantity: number; revenue: number };

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>("month");
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [customerRanks, setCustomerRanks] = useState<CustomerRank[]>([]);
  const [menuRanks, setMenuRanks] = useState<MenuRank[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalVisitDays, setTotalVisitDays] = useState(0);

  const getDateRange = useCallback((): { start: string; end: string } => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    const dow = now.getDay();

    switch (period) {
      case "week": {
        const startDate = new Date(y, m, d - dow);
        return {
          start: toDateStr(startDate),
          end: toDateStr(now),
        };
      }
      case "month":
        return {
          start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
          end: toDateStr(now),
        };
      case "lastMonth": {
        const lm = m === 0 ? 11 : m - 1;
        const ly = m === 0 ? y - 1 : y;
        const lastDay = new Date(ly, lm + 1, 0).getDate();
        return {
          start: `${ly}-${String(lm + 1).padStart(2, "0")}-01`,
          end: `${ly}-${String(lm + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
        };
      }
      case "all":
        return { start: "2000-01-01", end: "2099-12-31" };
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    const { start, end } = getDateRange();

    // Daily stats
    const daily = await db
      .select({
        date: barVisits.date,
        revenue: sql<number>`COALESCE(SUM(${barSlipItems.unitPrice} * ${barSlipItems.quantity}), 0)`,
        customers: sql<number>`COUNT(DISTINCT ${barSlips.id})`,
      })
      .from(barVisits)
      .leftJoin(barSlips, eq(barSlips.visitId, barVisits.id))
      .leftJoin(barSlipItems, eq(barSlipItems.slipId, barSlips.id))
      .where(and(gte(barVisits.date, start), lte(barVisits.date, end)))
      .groupBy(barVisits.date)
      .orderBy(asc(barVisits.date));

    setDailyStats(daily.map((d) => ({ date: d.date, revenue: Number(d.revenue), customers: Number(d.customers) })));

    // Totals
    const totRev = daily.reduce((s, d) => s + Number(d.revenue), 0);
    const totCust = daily.reduce((s, d) => s + Number(d.customers), 0);
    setTotalRevenue(totRev);
    setTotalCustomers(totCust);
    setTotalVisitDays(daily.length);

    // Event stats
    const evtRows = await db
      .select({
        eventId: barVisits.eventId,
        eventName: barEvents.name,
        revenue: sql<number>`COALESCE(SUM(${barSlipItems.unitPrice} * ${barSlipItems.quantity}), 0)`,
        customers: sql<number>`COUNT(DISTINCT ${barSlips.id})`,
      })
      .from(barVisits)
      .innerJoin(barEvents, eq(barVisits.eventId, barEvents.id))
      .leftJoin(barSlips, eq(barSlips.visitId, barVisits.id))
      .leftJoin(barSlipItems, eq(barSlipItems.slipId, barSlips.id))
      .where(
        and(
          gte(barVisits.date, start),
          lte(barVisits.date, end),
          eq(barVisits.dayType, "event")
        )
      )
      .groupBy(barVisits.eventId, barEvents.name);

    setEventStats(
      evtRows
        .filter((e) => e.eventId !== null)
        .map((e) => ({
          eventId: e.eventId!,
          eventName: e.eventName,
          revenue: Number(e.revenue),
          customers: Number(e.customers),
          avgSpend: Number(e.customers) > 0 ? Math.round(Number(e.revenue) / Number(e.customers)) : 0,
        }))
    );

    // Customer ranking
    const custRows = await db
      .select({
        customerId: barSlips.customerId,
        name: barCustomers.name,
        isMember: barCustomers.isMember,
        visits: sql<number>`COUNT(DISTINCT ${barSlips.id})`,
        totalSpend: sql<number>`COALESCE(SUM(${barSlipItems.unitPrice} * ${barSlipItems.quantity}), 0)`,
      })
      .from(barSlips)
      .innerJoin(barVisits, eq(barSlips.visitId, barVisits.id))
      .innerJoin(barCustomers, eq(barSlips.customerId, barCustomers.id))
      .leftJoin(barSlipItems, eq(barSlipItems.slipId, barSlips.id))
      .where(and(gte(barVisits.date, start), lte(barVisits.date, end)))
      .groupBy(barSlips.customerId, barCustomers.name, barCustomers.isMember)
      .orderBy(desc(sql`COALESCE(SUM(${barSlipItems.unitPrice} * ${barSlipItems.quantity}), 0)`))
      .limit(10);

    setCustomerRanks(
      custRows.map((c) => ({
        customerId: c.customerId,
        name: c.name,
        isMember: c.isMember,
        visits: Number(c.visits),
        totalSpend: Number(c.totalSpend),
      }))
    );

    // Menu ranking
    const menuRows = await db
      .select({
        menuItemId: barSlipItems.menuItemId,
        name: barMenuItems.name,
        quantity: sql<number>`COALESCE(SUM(${barSlipItems.quantity}), 0)`,
        revenue: sql<number>`COALESCE(SUM(${barSlipItems.unitPrice} * ${barSlipItems.quantity}), 0)`,
      })
      .from(barSlipItems)
      .innerJoin(barMenuItems, eq(barSlipItems.menuItemId, barMenuItems.id))
      .innerJoin(barSlips, eq(barSlipItems.slipId, barSlips.id))
      .innerJoin(barVisits, eq(barSlips.visitId, barVisits.id))
      .where(and(gte(barVisits.date, start), lte(barVisits.date, end)))
      .groupBy(barSlipItems.menuItemId, barMenuItems.name)
      .orderBy(desc(sql`COALESCE(SUM(${barSlipItems.quantity}), 0)`))
      .limit(10);

    setMenuRanks(
      menuRows.map((m) => ({
        menuItemId: m.menuItemId,
        name: m.name,
        quantity: Number(m.quantity),
        revenue: Number(m.revenue),
      }))
    );
  };

  const maxRevenue = dailyStats.length > 0 ? Math.max(...dailyStats.map((d) => d.revenue)) : 1;

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.summaryLabel}>総売上</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalCustomers}名</Text>
          <Text style={styles.summaryLabel}>総客数</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalVisitDays}日</Text>
          <Text style={styles.summaryLabel}>営業日数</Text>
        </View>
      </View>

      {/* Daily Revenue Chart (Simple Bar) */}
      {dailyStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日別売上</Text>
          <View style={styles.chartContainer}>
            {dailyStats.slice(-14).map((d) => (
              <View key={d.date} style={styles.barCol}>
                <Text style={styles.barValue}>
                  {d.revenue >= 10000 ? `${Math.round(d.revenue / 1000)}k` : d.revenue > 0 ? String(d.revenue) : ""}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: maxRevenue > 0 ? Math.max(4, (d.revenue / maxRevenue) * 100) : 4,
                      backgroundColor: d.revenue > 0 ? Colors.accent.gold : Colors.bg.input,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{d.date.slice(5)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Event Comparison */}
      {eventStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>イベント別</Text>
          {eventStats.map((evt) => (
            <View key={evt.eventId} style={styles.rankCard}>
              <View style={styles.rankIconWrap}>
                <FontAwesome name="calendar" size={16} color={Colors.accent.purple} />
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{evt.eventName}</Text>
                <Text style={styles.rankMeta}>
                  {evt.customers}名 ・ 客単価 {formatCurrency(evt.avgSpend)}
                </Text>
              </View>
              <Text style={styles.rankValue}>{formatCurrency(evt.revenue)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Customer Ranking */}
      {customerRanks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>顧客ランキング (利用金額)</Text>
          {customerRanks.map((c, i) => (
            <View key={c.customerId} style={styles.rankCard}>
              <View style={[styles.rankBadge, i < 3 && styles.rankBadgeTop]}>
                <Text style={[styles.rankBadgeText, i < 3 && styles.rankBadgeTextTop]}>
                  {i + 1}
                </Text>
              </View>
              <View style={styles.rankInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.rankName}>{c.name}</Text>
                  {c.isMember && (
                    <View style={styles.memberTag}>
                      <Text style={styles.memberTagText}>会員</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rankMeta}>{c.visits}回来店</Text>
              </View>
              <Text style={styles.rankValue}>{formatCurrency(c.totalSpend)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Menu Ranking */}
      {menuRanks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>人気メニュー</Text>
          {menuRanks.map((m, i) => (
            <View key={m.menuItemId} style={styles.rankCard}>
              <View style={[styles.rankBadge, i < 3 && styles.rankBadgeTop]}>
                <Text style={[styles.rankBadgeText, i < 3 && styles.rankBadgeTextTop]}>
                  {i + 1}
                </Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{m.name}</Text>
                <Text style={styles.rankMeta}>{m.quantity}杯/品</Text>
              </View>
              <Text style={styles.rankValue}>{formatCurrency(m.revenue)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {dailyStats.length === 0 && (
        <View style={styles.empty}>
          <FontAwesome name="bar-chart" size={40} color={Colors.text.tertiary} />
          <Text style={styles.emptyText}>データがありません</Text>
          <Text style={styles.emptySubtext}>営業データが蓄積されると分析が表示されます</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  periodRow: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtnActive: {
    backgroundColor: Colors.accent.redLight,
    borderColor: Colors.accent.red,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  periodTextActive: {
    color: Colors.accent.red,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
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
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    backgroundColor: Colors.bg.secondary,
    borderRadius: 12,
    padding: 12,
    paddingBottom: 8,
    minHeight: 160,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barCol: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    minHeight: 4,
  },
  barValue: {
    fontSize: 8,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 8,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent.purpleLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg.input,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankBadgeTop: {
    backgroundColor: Colors.accent.goldLight,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.tertiary,
  },
  rankBadgeTextTop: {
    color: Colors.accent.gold,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  rankMeta: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  rankValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  memberTag: {
    backgroundColor: Colors.accent.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  memberTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent.gold,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
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
});
