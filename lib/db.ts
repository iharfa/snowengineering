// SQLite database — the always-on system of record for sales tracking.
// Server-only; never import into a client component.
//
// Uses libSQL so the same code runs everywhere on free tiers:
//   - Local dev / VPS:  DATABASE_URL unset → local file data/snow.db
//   - Vercel (free):    DATABASE_URL=libsql://<db>.turso.io (Turso free tier)
//                       + DATABASE_AUTH_TOKEN
//
// Tables are created automatically on first use. All access degrades
// gracefully: if the database is unreachable, every helper no-ops and the
// site keeps working (orders still go to ERPNext / email).

import path from "path";
import fs from "fs";
import { createClient, type Client } from "@libsql/client";
import type { CartItem } from "@/lib/types";

const URL = process.env.DATABASE_URL || "file:data/snow.db";
const AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    via TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'Open',
    customer_name TEXT NOT NULL,
    company TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    location TEXT NOT NULL,
    preferred_contact TEXT NOT NULL,
    order_notes TEXT,
    items_json TEXT NOT NULL,
    subtotal REAL NOT NULL,
    gst_amount REAL NOT NULL,
    total REAL NOT NULL,
    erpnext_recorded INTEGER NOT NULL DEFAULT 0,
    emailed INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'New',
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS price_reveals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    item_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    ip_hash TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS product_overrides (
    item_code TEXT PRIMARY KEY,
    price REAL,
    stock_status TEXT,
    is_price_hidden INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

let client: Client | null = null;
let ready: Promise<Client | null> | null = null;

function connect(): Promise<Client | null> {
  if (!ready) {
    ready = (async () => {
      try {
        if (URL.startsWith("file:")) {
          fs.mkdirSync(path.dirname(path.resolve(URL.slice(5))), {
            recursive: true,
          });
        }
        const c = createClient({ url: URL, authToken: AUTH_TOKEN });
        await c.batch(SCHEMA, "write");
        client = c;
        return c;
      } catch (err) {
        console.error("Database unavailable — running without local DB", err);
        return null;
      }
    })();
  }
  return ready;
}

export async function dbAvailable(): Promise<boolean> {
  return (await connect()) !== null;
}

// --- orders ------------------------------------------------------------------

export const ORDER_STATUSES = ["Open", "Quoted", "Confirmed", "Closed", "Cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderRow {
  id: number;
  created_at: string;
  via: string;
  status: OrderStatus;
  customer_name: string;
  company: string | null;
  phone: string;
  email: string;
  location: string;
  preferred_contact: string;
  order_notes: string | null;
  items_json: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  erpnext_recorded: number;
  emailed: number;
}

export async function insertOrder(o: {
  via: string;
  customer_name: string;
  company?: string;
  phone: string;
  email: string;
  location: string;
  preferred_contact: string;
  order_notes?: string;
  items: CartItem[];
  subtotal: number;
  gst_amount: number;
  total: number;
}): Promise<number | null> {
  const d = await connect();
  if (!d) return null;
  const r = await d.execute({
    sql: `INSERT INTO orders (via, customer_name, company, phone, email, location,
            preferred_contact, order_notes, items_json, subtotal, gst_amount, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      o.via,
      o.customer_name,
      o.company ?? null,
      o.phone,
      o.email,
      o.location,
      o.preferred_contact,
      o.order_notes ?? null,
      JSON.stringify(o.items),
      o.subtotal,
      o.gst_amount,
      o.total,
    ],
  });
  return r.lastInsertRowid != null ? Number(r.lastInsertRowid) : null;
}

export async function markOrderChannels(
  id: number,
  erpnextRecorded: boolean,
  emailed: boolean
) {
  const d = await connect();
  await d?.execute({
    sql: `UPDATE orders SET erpnext_recorded = ?, emailed = ? WHERE id = ?`,
    args: [erpnextRecorded ? 1 : 0, emailed ? 1 : 0, id],
  });
}

export async function listOrders(limit = 200): Promise<OrderRow[]> {
  const d = await connect();
  if (!d) return [];
  const r = await d.execute({
    sql: `SELECT * FROM orders ORDER BY id DESC LIMIT ?`,
    args: [limit],
  });
  return r.rows as unknown as OrderRow[];
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const d = await connect();
  await d?.execute({
    sql: `UPDATE orders SET status = ? WHERE id = ?`,
    args: [status, id],
  });
}

// --- leads ---------------------------------------------------------------

export const LEAD_STATUSES = ["New", "Contacted", "Closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadRow {
  id: number;
  created_at: string;
  status: LeadStatus;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  message: string;
}

export async function insertLead(l: {
  name: string;
  company?: string;
  email: string;
  phone: string;
  message: string;
}): Promise<number | null> {
  const d = await connect();
  if (!d) return null;
  const r = await d.execute({
    sql: `INSERT INTO leads (name, company, email, phone, message)
          VALUES (?, ?, ?, ?, ?)`,
    args: [l.name, l.company ?? null, l.email, l.phone, l.message],
  });
  return r.lastInsertRowid != null ? Number(r.lastInsertRowid) : null;
}

export async function listLeads(limit = 200): Promise<LeadRow[]> {
  const d = await connect();
  if (!d) return [];
  const r = await d.execute({
    sql: `SELECT * FROM leads ORDER BY id DESC LIMIT ?`,
    args: [limit],
  });
  return r.rows as unknown as LeadRow[];
}

export async function updateLeadStatus(id: number, status: LeadStatus) {
  const d = await connect();
  await d?.execute({
    sql: `UPDATE leads SET status = ? WHERE id = ?`,
    args: [status, id],
  });
}

// --- price reveal analytics -----------------------------------------------

export async function insertPriceReveal(p: {
  item_code: string;
  product_name: string;
  category: string;
  session_id: string;
  user_agent?: string;
  referrer?: string;
  ip_hash?: string;
}) {
  const d = await connect();
  await d?.execute({
    sql: `INSERT INTO price_reveals (item_code, product_name, category, session_id, user_agent, referrer, ip_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      p.item_code,
      p.product_name,
      p.category,
      p.session_id,
      p.user_agent ?? null,
      p.referrer ?? null,
      p.ip_hash ?? null,
    ],
  });
}

export interface RevealStat {
  item_code: string;
  product_name: string;
  reveals: number;
  sessions: number;
}

export async function revealStats(days = 30): Promise<RevealStat[]> {
  const d = await connect();
  if (!d) return [];
  const r = await d.execute({
    sql: `SELECT item_code, product_name, COUNT(*) AS reveals,
                 COUNT(DISTINCT session_id) AS sessions
          FROM price_reveals
          WHERE created_at >= datetime('now', ?)
          GROUP BY item_code, product_name
          ORDER BY reveals DESC`,
    args: [`-${days} days`],
  });
  return r.rows.map((row) => ({
    item_code: String(row.item_code),
    product_name: String(row.product_name),
    reveals: Number(row.reveals),
    sessions: Number(row.sessions),
  }));
}

// --- product overrides ------------------------------------------------------
// Admin-editable price / stock / visibility on top of the seed catalog, so the
// shop can be managed without a code deploy (and without ERPNext).

export interface ProductOverride {
  item_code: string;
  price: number | null;
  stock_status: string | null;
  is_price_hidden: number | null;
  updated_at: string;
}

export async function getProductOverride(
  itemCode: string
): Promise<ProductOverride | null> {
  const d = await connect();
  if (!d) return null;
  const r = await d.execute({
    sql: `SELECT * FROM product_overrides WHERE item_code = ?`,
    args: [itemCode],
  });
  return (r.rows[0] as unknown as ProductOverride | undefined) ?? null;
}

export async function listProductOverrides(): Promise<ProductOverride[]> {
  const d = await connect();
  if (!d) return [];
  const r = await d.execute(`SELECT * FROM product_overrides`);
  return r.rows as unknown as ProductOverride[];
}

export async function upsertProductOverride(o: {
  item_code: string;
  price?: number | null;
  stock_status?: string | null;
  is_price_hidden?: boolean | null;
}) {
  const d = await connect();
  await d?.execute({
    sql: `INSERT INTO product_overrides (item_code, price, stock_status, is_price_hidden, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(item_code) DO UPDATE SET
            price = excluded.price,
            stock_status = excluded.stock_status,
            is_price_hidden = excluded.is_price_hidden,
            updated_at = excluded.updated_at`,
    args: [
      o.item_code,
      o.price ?? null,
      o.stock_status ?? null,
      o.is_price_hidden == null ? null : o.is_price_hidden ? 1 : 0,
    ],
  });
}

// --- dashboard counts ---------------------------------------------------------

export async function dashboardCounts() {
  const d = await connect();
  if (!d) return null;
  const [open, total, pipeline, leadsNew, leadsTotal, reveals] = await d.batch(
    [
      `SELECT COUNT(*) n FROM orders WHERE status IN ('Open','Quoted')`,
      `SELECT COUNT(*) n FROM orders`,
      `SELECT COALESCE(SUM(total), 0) n FROM orders WHERE status IN ('Open','Quoted','Confirmed')`,
      `SELECT COUNT(*) n FROM leads WHERE status = 'New'`,
      `SELECT COUNT(*) n FROM leads`,
      `SELECT COUNT(*) n FROM price_reveals WHERE created_at >= datetime('now', '-30 days')`,
    ],
    "read"
  );
  const n = (r: { rows: unknown[] }) => Number((r.rows[0] as { n: unknown }).n);
  return {
    ordersOpen: n(open),
    ordersTotal: n(total),
    pipelineValue: n(pipeline),
    leadsNew: n(leadsNew),
    leadsTotal: n(leadsTotal),
    reveals30d: n(reveals),
  };
}
