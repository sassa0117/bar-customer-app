import { db } from "./client";
import { barCustomers, barMenuItems, barEvents, appSettings } from "./schema";
import { generateId } from "@/lib/utils";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existing = await db
    .select()
    .from(appSettings)
    .where(sql`${appSettings.key} = 'seeded'`);

  if (existing.length > 0) return;

  const now = new Date();

  // Sample Customers
  await db.insert(barCustomers).values([
    { id: generateId(), name: "田中太郎", nameKana: "たなかたろう", isMember: true, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "佐藤花子", nameKana: "さとうはなこ", isMember: true, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "鈴木一郎", nameKana: "すずきいちろう", isMember: true, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "高橋美咲", nameKana: "たかはしみさき", isMember: true, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "渡辺健太", nameKana: "わたなべけんた", isMember: true, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "伊藤大輔", nameKana: "いとうだいすけ", isMember: false, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "山本裕子", nameKana: "やまもとゆうこ", isMember: false, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "中村翔太", nameKana: "なかむらしょうた", isMember: true, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "小林麻衣", nameKana: "こばやしまい", isMember: false, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "加藤勇気", nameKana: "かとうゆうき", isMember: true, isActive: true, createdAt: now, updatedAt: now },
  ]);

  // Sample Menu Items
  await db.insert(barMenuItems).values([
    // Drinks
    { id: generateId(), name: "生ビール", category: "drink", price: 600, sortOrder: 0, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "ハイボール", category: "drink", price: 500, sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "レモンサワー", category: "drink", price: 500, sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "日本酒 (1合)", category: "drink", price: 800, sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "ウイスキー", category: "drink", price: 700, sortOrder: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "カクテル各種", category: "drink", price: 600, sortOrder: 5, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "ソフトドリンク", category: "drink", price: 300, sortOrder: 6, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "ワイン (グラス)", category: "drink", price: 700, sortOrder: 7, isActive: true, createdAt: now, updatedAt: now },
    // Food
    { id: generateId(), name: "枝豆", category: "food", price: 400, sortOrder: 0, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "唐揚げ", category: "food", price: 600, sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "刺身盛り合わせ", category: "food", price: 1200, sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "焼き鳥 (5本)", category: "food", price: 800, sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "ポテトフライ", category: "food", price: 400, sortOrder: 4, isActive: true, createdAt: now, updatedAt: now },
    // Other
    { id: generateId(), name: "チャージ料", category: "other", price: 500, sortOrder: 0, isActive: true, createdAt: now, updatedAt: now },
    { id: generateId(), name: "カラオケ (1曲)", category: "other", price: 100, sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
  ]);

  // Sample Events
  await db.insert(barEvents).values([
    { id: generateId(), name: "ワイン試飲会", description: "厳選ワインのテイスティングイベント", isActive: true, createdAt: now },
    { id: generateId(), name: "ジャズライブ", description: "生演奏のジャズナイト", isActive: true, createdAt: now },
    { id: generateId(), name: "日本酒の会", description: "季節の日本酒を楽しむ会", isActive: true, createdAt: now },
  ]);

  // Mark as seeded
  await db.insert(appSettings).values({
    key: "seeded",
    value: "true",
    updatedAt: now,
  });
}
