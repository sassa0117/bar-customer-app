import { create } from "zustand";
import { db } from "@/db/client";
import { barVisits, barSlips, barSlipItems, barMenuItems, barCustomers } from "@/db/schema";
import { generateId, getTodayString } from "@/lib/utils";
import { eq, and, sql } from "drizzle-orm";

type Visit = typeof barVisits.$inferSelect;
type Slip = typeof barSlips.$inferSelect;
type SlipItem = typeof barSlipItems.$inferSelect;

export type SlipWithTotal = Slip & {
  customerName: string;
  isMember: boolean;
  total: number;
  itemCount: number;
};

export type SlipItemDetail = SlipItem & {
  menuItemName: string;
};

interface VisitStore {
  todayVisit: Visit | null;
  slips: SlipWithTotal[];
  activeSlip: (Slip & { items: SlipItemDetail[]; customerName: string; total: number }) | null;
  loading: boolean;

  loadTodayVisit: () => Promise<void>;
  setDayType: (type: string, eventId?: string | null) => Promise<void>;
  openSlip: (customerId: string) => Promise<string>;
  loadSlips: () => Promise<void>;
  loadSlipDetail: (slipId: string) => Promise<void>;
  addItem: (slipId: string, menuItemId: string) => Promise<void>;
  incrementItem: (slipItemId: string) => Promise<void>;
  decrementItem: (slipItemId: string) => Promise<void>;
  removeItem: (slipItemId: string) => Promise<void>;
  closeSlip: (slipId: string) => Promise<void>;
  closeAllSlips: () => Promise<void>;
  closeVisit: () => Promise<void>;
}

export const useVisitStore = create<VisitStore>((set, get) => ({
  todayVisit: null,
  slips: [],
  activeSlip: null,
  loading: false,

  loadTodayVisit: async () => {
    set({ loading: true });
    const today = getTodayString();
    const rows = await db
      .select()
      .from(barVisits)
      .where(eq(barVisits.date, today));

    if (rows.length > 0) {
      set({ todayVisit: rows[0], loading: false });
    } else {
      const now = new Date();
      const id = generateId();
      await db.insert(barVisits).values({
        id,
        date: today,
        dayType: "normal",
        isClosed: false,
        createdAt: now,
        updatedAt: now,
      });
      const created = await db.select().from(barVisits).where(eq(barVisits.id, id));
      set({ todayVisit: created[0], loading: false });
    }
    await get().loadSlips();
  },

  setDayType: async (type, eventId) => {
    const visit = get().todayVisit;
    if (!visit) return;
    await db
      .update(barVisits)
      .set({ dayType: type, eventId: eventId || null, updatedAt: new Date() })
      .where(eq(barVisits.id, visit.id));
    await get().loadTodayVisit();
  },

  openSlip: async (customerId) => {
    const visit = get().todayVisit;
    if (!visit) throw new Error("No visit for today");
    const now = new Date();
    const id = generateId();
    await db.insert(barSlips).values({
      id,
      visitId: visit.id,
      customerId,
      status: "open",
      openedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await get().loadSlips();
    return id;
  },

  loadSlips: async () => {
    const visit = get().todayVisit;
    if (!visit) return;

    const rows = await db
      .select({
        id: barSlips.id,
        visitId: barSlips.visitId,
        customerId: barSlips.customerId,
        status: barSlips.status,
        openedAt: barSlips.openedAt,
        closedAt: barSlips.closedAt,
        createdAt: barSlips.createdAt,
        updatedAt: barSlips.updatedAt,
        customerName: barCustomers.name,
        isMember: barCustomers.isMember,
      })
      .from(barSlips)
      .innerJoin(barCustomers, eq(barSlips.customerId, barCustomers.id))
      .where(eq(barSlips.visitId, visit.id))
      .orderBy(sql`CASE WHEN ${barSlips.status} = 'open' THEN 0 ELSE 1 END, ${barSlips.openedAt} DESC`);

    const slipsWithTotals: SlipWithTotal[] = [];
    for (const row of rows) {
      const totals = await db
        .select({
          total: sql<number>`COALESCE(SUM(${barSlipItems.unitPrice} * ${barSlipItems.quantity}), 0)`,
          count: sql<number>`COALESCE(SUM(${barSlipItems.quantity}), 0)`,
        })
        .from(barSlipItems)
        .where(eq(barSlipItems.slipId, row.id));

      slipsWithTotals.push({
        ...row,
        total: Number(totals[0]?.total ?? 0),
        itemCount: Number(totals[0]?.count ?? 0),
      });
    }

    set({ slips: slipsWithTotals });
  },

  loadSlipDetail: async (slipId) => {
    const slipRows = await db
      .select({
        id: barSlips.id,
        visitId: barSlips.visitId,
        customerId: barSlips.customerId,
        status: barSlips.status,
        openedAt: barSlips.openedAt,
        closedAt: barSlips.closedAt,
        createdAt: barSlips.createdAt,
        updatedAt: barSlips.updatedAt,
        customerName: barCustomers.name,
      })
      .from(barSlips)
      .innerJoin(barCustomers, eq(barSlips.customerId, barCustomers.id))
      .where(eq(barSlips.id, slipId));

    if (slipRows.length === 0) return;
    const slip = slipRows[0];

    const items = await db
      .select({
        id: barSlipItems.id,
        slipId: barSlipItems.slipId,
        menuItemId: barSlipItems.menuItemId,
        quantity: barSlipItems.quantity,
        unitPrice: barSlipItems.unitPrice,
        createdAt: barSlipItems.createdAt,
        menuItemName: barMenuItems.name,
      })
      .from(barSlipItems)
      .innerJoin(barMenuItems, eq(barSlipItems.menuItemId, barMenuItems.id))
      .where(eq(barSlipItems.slipId, slipId))
      .orderBy(barSlipItems.createdAt);

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    set({
      activeSlip: {
        ...slip,
        items,
        customerName: slip.customerName,
        total,
      },
    });
  },

  addItem: async (slipId, menuItemId) => {
    const menuItem = (
      await db.select().from(barMenuItems).where(eq(barMenuItems.id, menuItemId))
    )[0];
    if (!menuItem) return;

    // Check if this menu item already exists in the slip
    const existing = await db
      .select()
      .from(barSlipItems)
      .where(and(eq(barSlipItems.slipId, slipId), eq(barSlipItems.menuItemId, menuItemId)));

    if (existing.length > 0) {
      await db
        .update(barSlipItems)
        .set({ quantity: existing[0].quantity + 1 })
        .where(eq(barSlipItems.id, existing[0].id));
    } else {
      await db.insert(barSlipItems).values({
        id: generateId(),
        slipId,
        menuItemId,
        quantity: 1,
        unitPrice: menuItem.price,
        createdAt: new Date(),
      });
    }

    await get().loadSlipDetail(slipId);
    await get().loadSlips();
  },

  incrementItem: async (slipItemId) => {
    const item = (await db.select().from(barSlipItems).where(eq(barSlipItems.id, slipItemId)))[0];
    if (!item) return;
    await db
      .update(barSlipItems)
      .set({ quantity: item.quantity + 1 })
      .where(eq(barSlipItems.id, slipItemId));
    await get().loadSlipDetail(item.slipId);
    await get().loadSlips();
  },

  decrementItem: async (slipItemId) => {
    const item = (await db.select().from(barSlipItems).where(eq(barSlipItems.id, slipItemId)))[0];
    if (!item) return;
    if (item.quantity <= 1) {
      await db.delete(barSlipItems).where(eq(barSlipItems.id, slipItemId));
    } else {
      await db
        .update(barSlipItems)
        .set({ quantity: item.quantity - 1 })
        .where(eq(barSlipItems.id, slipItemId));
    }
    await get().loadSlipDetail(item.slipId);
    await get().loadSlips();
  },

  removeItem: async (slipItemId) => {
    const item = (await db.select().from(barSlipItems).where(eq(barSlipItems.id, slipItemId)))[0];
    if (!item) return;
    await db.delete(barSlipItems).where(eq(barSlipItems.id, slipItemId));
    await get().loadSlipDetail(item.slipId);
    await get().loadSlips();
  },

  closeSlip: async (slipId) => {
    const now = new Date();
    await db
      .update(barSlips)
      .set({ status: "closed", closedAt: now, updatedAt: now })
      .where(eq(barSlips.id, slipId));
    await get().loadSlipDetail(slipId);
    await get().loadSlips();
  },

  closeAllSlips: async () => {
    const visit = get().todayVisit;
    if (!visit) return;
    const now = new Date();
    await db
      .update(barSlips)
      .set({ status: "closed", closedAt: now, updatedAt: now })
      .where(and(eq(barSlips.visitId, visit.id), eq(barSlips.status, "open")));
    await get().loadSlips();
  },

  closeVisit: async () => {
    const visit = get().todayVisit;
    if (!visit) return;
    await get().closeAllSlips();
    await db
      .update(barVisits)
      .set({ isClosed: true, updatedAt: new Date() })
      .where(eq(barVisits.id, visit.id));
    await get().loadTodayVisit();
  },
}));
