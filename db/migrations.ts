import { db } from "./client";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bar_customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_kana TEXT,
      photo_uri TEXT,
      is_member INTEGER NOT NULL DEFAULT 0,
      memo TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bar_menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bar_events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bar_visits (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      day_type TEXT NOT NULL DEFAULT 'normal',
      event_id TEXT REFERENCES bar_events(id),
      is_closed INTEGER NOT NULL DEFAULT 0,
      memo TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bar_slips (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES bar_visits(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES bar_customers(id),
      status TEXT NOT NULL DEFAULT 'open',
      opened_at INTEGER NOT NULL,
      closed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bar_slip_items (
      id TEXT PRIMARY KEY,
      slip_id TEXT NOT NULL REFERENCES bar_slips(id) ON DELETE CASCADE,
      menu_item_id TEXT NOT NULL REFERENCES bar_menu_items(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Indexes for performance
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_bar_visits_date ON bar_visits(date)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_bar_slips_visit ON bar_slips(visit_id, customer_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_bar_slip_items_slip ON bar_slip_items(slip_id)`);
}
