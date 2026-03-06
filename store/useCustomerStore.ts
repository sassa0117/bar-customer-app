import { create } from "zustand";
import { db } from "@/db/client";
import { barCustomers } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";

type Customer = typeof barCustomers.$inferSelect;

type CustomerInput = {
  name: string;
  nameKana?: string;
  isMember: boolean;
  memo?: string;
};

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  loadCustomers: () => Promise<void>;
  addCustomer: (data: CustomerInput) => Promise<void>;
  updateCustomer: (id: string, data: Partial<CustomerInput>) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,

  loadCustomers: async () => {
    set({ loading: true });
    const rows = await db
      .select()
      .from(barCustomers)
      .where(eq(barCustomers.isActive, true))
      .orderBy(sql`CASE WHEN ${barCustomers.nameKana} IS NOT NULL THEN ${barCustomers.nameKana} ELSE ${barCustomers.name} END`);
    set({ customers: rows, loading: false });
  },

  addCustomer: async (data) => {
    const now = new Date();
    await db.insert(barCustomers).values({
      id: generateId(),
      name: data.name,
      nameKana: data.nameKana || null,
      isMember: data.isMember,
      memo: data.memo || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await get().loadCustomers();
  },

  updateCustomer: async (id, data) => {
    const now = new Date();
    await db
      .update(barCustomers)
      .set({ ...data, updatedAt: now })
      .where(eq(barCustomers.id, id));
    await get().loadCustomers();
  },

  toggleActive: async (id) => {
    const customer = (await db.select().from(barCustomers).where(eq(barCustomers.id, id)))[0];
    if (!customer) return;
    await db
      .update(barCustomers)
      .set({ isActive: !customer.isActive, updatedAt: new Date() })
      .where(eq(barCustomers.id, id));
    await get().loadCustomers();
  },
}));
