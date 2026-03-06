import { create } from "zustand";
import { db } from "@/db/client";
import { barMenuItems, barEvents } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { eq, asc } from "drizzle-orm";

type MenuItem = typeof barMenuItems.$inferSelect;
type BarEvent = typeof barEvents.$inferSelect;

type MenuItemInput = {
  name: string;
  category: string;
  price: number;
  sortOrder?: number;
};

type EventInput = {
  name: string;
  description?: string;
};

interface MenuStore {
  menuItems: MenuItem[];
  events: BarEvent[];
  loading: boolean;
  loadMenuItems: () => Promise<void>;
  addMenuItem: (data: MenuItemInput) => Promise<void>;
  updateMenuItem: (id: string, data: Partial<MenuItemInput>) => Promise<void>;
  toggleMenuItemActive: (id: string) => Promise<void>;
  loadEvents: () => Promise<void>;
  addEvent: (data: EventInput) => Promise<void>;
  updateEvent: (id: string, data: Partial<EventInput>) => Promise<void>;
  toggleEventActive: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuItems: [],
  events: [],
  loading: false,

  loadMenuItems: async () => {
    set({ loading: true });
    const rows = await db
      .select()
      .from(barMenuItems)
      .where(eq(barMenuItems.isActive, true))
      .orderBy(asc(barMenuItems.category), asc(barMenuItems.sortOrder));
    set({ menuItems: rows, loading: false });
  },

  addMenuItem: async (data) => {
    const now = new Date();
    await db.insert(barMenuItems).values({
      id: generateId(),
      name: data.name,
      category: data.category,
      price: data.price,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await get().loadMenuItems();
  },

  updateMenuItem: async (id, data) => {
    await db
      .update(barMenuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(barMenuItems.id, id));
    await get().loadMenuItems();
  },

  toggleMenuItemActive: async (id) => {
    const item = (await db.select().from(barMenuItems).where(eq(barMenuItems.id, id)))[0];
    if (!item) return;
    await db
      .update(barMenuItems)
      .set({ isActive: !item.isActive, updatedAt: new Date() })
      .where(eq(barMenuItems.id, id));
    await get().loadMenuItems();
  },

  loadEvents: async () => {
    const rows = await db
      .select()
      .from(barEvents)
      .where(eq(barEvents.isActive, true))
      .orderBy(asc(barEvents.name));
    set({ events: rows });
  },

  addEvent: async (data) => {
    await db.insert(barEvents).values({
      id: generateId(),
      name: data.name,
      description: data.description || null,
      isActive: true,
      createdAt: new Date(),
    });
    await get().loadEvents();
  },

  updateEvent: async (id, data) => {
    await db
      .update(barEvents)
      .set(data)
      .where(eq(barEvents.id, id));
    await get().loadEvents();
  },

  toggleEventActive: async (id) => {
    const evt = (await db.select().from(barEvents).where(eq(barEvents.id, id)))[0];
    if (!evt) return;
    await db
      .update(barEvents)
      .set({ isActive: !evt.isActive })
      .where(eq(barEvents.id, id));
    await get().loadEvents();
  },
}));
