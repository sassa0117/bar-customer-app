import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============ BAR CUSTOMER TRACKER ============

export const barCustomers = sqliteTable("bar_customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameKana: text("name_kana"),
  photoUri: text("photo_uri"),
  isMember: integer("is_member", { mode: "boolean" }).notNull().default(false),
  memo: text("memo"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const barMenuItems = sqliteTable("bar_menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const barEvents = sqliteTable("bar_events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const barVisits = sqliteTable("bar_visits", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  dayType: text("day_type").notNull().default("normal"),
  eventId: text("event_id").references(() => barEvents.id),
  isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
  memo: text("memo"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const barSlips = sqliteTable("bar_slips", {
  id: text("id").primaryKey(),
  visitId: text("visit_id")
    .notNull()
    .references(() => barVisits.id, { onDelete: "cascade" }),
  customerId: text("customer_id")
    .notNull()
    .references(() => barCustomers.id),
  status: text("status").notNull().default("open"),
  openedAt: integer("opened_at", { mode: "timestamp" }).notNull(),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const barSlipItems = sqliteTable("bar_slip_items", {
  id: text("id").primaryKey(),
  slipId: text("slip_id")
    .notNull()
    .references(() => barSlips.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => barMenuItems.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
