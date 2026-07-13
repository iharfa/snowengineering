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
import type { CartItem, Product } from "@/lib/types";
import { products as seedProducts } from "@/data/products";

// TURSO_* names are what the Vercel <-> Turso integration injects; DATABASE_*
// are the generic names. Either works.
const URL =
  process.env.DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  "file:data/snow.db";
const AUTH_TOKEN =
  process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

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
  `CREATE TABLE IF NOT EXISTS products (
    item_code TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    long_description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '/products/placeholder.svg',
    specifications_json TEXT NOT NULL DEFAULT '[]',
    stock_status TEXT NOT NULL DEFAULT 'On Request',
    price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'MVR',
    gst_rate REAL NOT NULL DEFAULT 8,
    is_price_hidden INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT NOT NULL UNIQUE,
    order_id INTEGER,
    status TEXT NOT NULL DEFAULT 'Draft',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    issued_at TEXT,
    customer_name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    location TEXT,
    items_json TEXT NOT NULL,
    subtotal REAL NOT NULL,
    gst_amount REAL NOT NULL,
    total REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'MVR',
    notes TEXT
  )`,
];

// One-time migration: copy the seed catalog (plus any legacy price/stock
// overrides) into the products table so the shop is fully database-managed.
async function seedProductsIfEmpty(c: Client) {
  const count = Number(
    (await c.execute(`SELECT COUNT(*) n FROM products`)).rows[0].n
  );
  if (count > 0) return;
  const overrides = new Map(
    (await c.execute(`SELECT * FROM product_overrides`)).rows.map((r) => [
      String(r.item_code),
      r as unknown as ProductOverride,
    ])
  );
  for (const p of seedProducts) {
    const o = overrides.get(p.erpnextItemCode);
    await c.execute({
      sql: `INSERT INTO products (item_code, id, slug, name, category,
              short_description, long_description, image, specifications_json,
              stock_status, price, currency, gst_rate, is_price_hidden)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.erpnextItemCode,
        p.id,
        p.slug,
        p.name,
        p.category,
        p.shortDescription,
        p.longDescription,
        p.image,
        JSON.stringify(p.specifications),
        o?.stock_status ?? p.stockStatus,
        o?.price ?? p.price,
        p.currency,
        p.gstRate,
        p.isPriceHidden ? 1 : 0,
      ],
    });
  }
}

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
        await seedProductsIfEmpty(c);
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

// --- legacy product overrides ------------------------------------------------
// Superseded by the products table; kept only so seedProductsIfEmpty can carry
// old override values into the catalog on first migration.

export interface ProductOverride {
  item_code: string;
  price: number | null;
  stock_status: string | null;
  is_price_hidden: number | null;
  updated_at: string;
}

// --- products (database-managed catalog) -------------------------------------

interface ProductRow {
  item_code: string;
  id: string;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  long_description: string;
  image: string;
  specifications_json: string;
  stock_status: string;
  price: number;
  currency: string;
  gst_rate: number;
  is_price_hidden: number;
  active: number;
  created_at: string;
  updated_at: string;
}

function rowToProduct(r: ProductRow): Product & { active: boolean } {
  let specifications: { label: string; value: string }[] = [];
  try {
    specifications = JSON.parse(r.specifications_json);
  } catch {
    // tolerate malformed specs
  }
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    shortDescription: r.short_description,
    longDescription: r.long_description,
    image: r.image,
    specifications,
    stockStatus: r.stock_status as Product["stockStatus"],
    price: Number(r.price),
    currency: r.currency,
    gstRate: Number(r.gst_rate),
    isPriceHidden: Boolean(r.is_price_hidden),
    erpnextItemCode: r.item_code,
    active: Boolean(r.active),
  };
}

export async function dbListProducts(
  includeArchived = false
): Promise<(Product & { active: boolean })[] | null> {
  const d = await connect();
  if (!d) return null;
  const r = await d.execute(
    includeArchived
      ? `SELECT * FROM products ORDER BY category, name`
      : `SELECT * FROM products WHERE active = 1 ORDER BY category, name`
  );
  return (r.rows as unknown as ProductRow[]).map(rowToProduct);
}

export async function dbGetProduct(
  by: "slug" | "item_code",
  value: string
): Promise<(Product & { active: boolean }) | null> {
  const d = await connect();
  if (!d) return null;
  const r = await d.execute({
    sql: `SELECT * FROM products WHERE ${by === "slug" ? "slug" : "item_code"} = ?`,
    args: [value],
  });
  const row = r.rows[0] as unknown as ProductRow | undefined;
  return row ? rowToProduct(row) : null;
}

export interface ProductInput {
  item_code: string;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  long_description: string;
  image: string;
  specifications: { label: string; value: string }[];
  stock_status: string;
  price: number;
  gst_rate: number;
  is_price_hidden: boolean;
}

export async function dbCreateProduct(p: ProductInput): Promise<boolean> {
  const d = await connect();
  if (!d) return false;
  await d.execute({
    sql: `INSERT INTO products (item_code, id, slug, name, category,
            short_description, long_description, image, specifications_json,
            stock_status, price, currency, gst_rate, is_price_hidden)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MVR', ?, ?)`,
    args: [
      p.item_code,
      p.item_code.toLowerCase(),
      p.slug,
      p.name,
      p.category,
      p.short_description,
      p.long_description,
      p.image,
      JSON.stringify(p.specifications),
      p.stock_status,
      p.price,
      p.gst_rate,
      p.is_price_hidden ? 1 : 0,
    ],
  });
  return true;
}

export async function dbUpdateProduct(
  itemCode: string,
  p: Omit<ProductInput, "item_code">
): Promise<void> {
  const d = await connect();
  await d?.execute({
    sql: `UPDATE products SET slug = ?, name = ?, category = ?,
            short_description = ?, long_description = ?, image = ?,
            specifications_json = ?, stock_status = ?, price = ?,
            gst_rate = ?, is_price_hidden = ?, updated_at = datetime('now')
          WHERE item_code = ?`,
    args: [
      p.slug,
      p.name,
      p.category,
      p.short_description,
      p.long_description,
      p.image,
      JSON.stringify(p.specifications),
      p.stock_status,
      p.price,
      p.gst_rate,
      p.is_price_hidden ? 1 : 0,
      itemCode,
    ],
  });
}

export async function dbSetProductActive(itemCode: string, active: boolean) {
  const d = await connect();
  await d?.execute({
    sql: `UPDATE products SET active = ?, updated_at = datetime('now') WHERE item_code = ?`,
    args: [active ? 1 : 0, itemCode],
  });
}

// --- invoices ------------------------------------------------------------------

export const INVOICE_STATUSES = ["Draft", "Issued", "Paid", "Void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceRow {
  id: number;
  invoice_no: string;
  order_id: number | null;
  status: InvoiceStatus;
  created_at: string;
  issued_at: string | null;
  customer_name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  items_json: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  currency: string;
  notes: string | null;
}

async function nextInvoiceNo(d: Client): Promise<string> {
  const year = new Date().getFullYear();
  const r = await d.execute({
    sql: `SELECT invoice_no FROM invoices WHERE invoice_no LIKE ? ORDER BY id DESC LIMIT 1`,
    args: [`INV-${year}-%`],
  });
  const last = r.rows[0]?.invoice_no as string | undefined;
  const seq = last ? Number(last.split("-")[2]) + 1 : 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}

export async function insertInvoice(inv: {
  order_id?: number | null;
  customer_name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  items: CartItem[];
  subtotal: number;
  gst_amount: number;
  total: number;
  notes?: string | null;
}): Promise<number | null> {
  const d = await connect();
  if (!d) return null;
  const no = await nextInvoiceNo(d);
  const r = await d.execute({
    sql: `INSERT INTO invoices (invoice_no, order_id, customer_name, company,
            phone, email, location, items_json, subtotal, gst_amount, total, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      no,
      inv.order_id ?? null,
      inv.customer_name,
      inv.company ?? null,
      inv.phone ?? null,
      inv.email ?? null,
      inv.location ?? null,
      JSON.stringify(inv.items),
      inv.subtotal,
      inv.gst_amount,
      inv.total,
      inv.notes ?? null,
    ],
  });
  return r.lastInsertRowid != null ? Number(r.lastInsertRowid) : null;
}

export async function listInvoices(limit = 200): Promise<InvoiceRow[]> {
  const d = await connect();
  if (!d) return [];
  const r = await d.execute({
    sql: `SELECT * FROM invoices ORDER BY id DESC LIMIT ?`,
    args: [limit],
  });
  return r.rows as unknown as InvoiceRow[];
}

export async function getInvoice(id: number): Promise<InvoiceRow | null> {
  const d = await connect();
  if (!d) return null;
  const r = await d.execute({
    sql: `SELECT * FROM invoices WHERE id = ?`,
    args: [id],
  });
  return (r.rows[0] as unknown as InvoiceRow | undefined) ?? null;
}

export async function getOrder(id: number): Promise<OrderRow | null> {
  const d = await connect();
  if (!d) return null;
  const r = await d.execute({
    sql: `SELECT * FROM orders WHERE id = ?`,
    args: [id],
  });
  return (r.rows[0] as unknown as OrderRow | undefined) ?? null;
}

export async function updateInvoiceStatus(id: number, status: InvoiceStatus) {
  const d = await connect();
  // issued_at stamps the tax point the first time an invoice is issued
  await d?.execute({
    sql: `UPDATE invoices SET status = ?,
            issued_at = CASE WHEN ? = 'Issued' AND issued_at IS NULL
                             THEN datetime('now') ELSE issued_at END
          WHERE id = ?`,
    args: [status, status, id],
  });
}

// GST collected per month for Issued/Paid invoices — the numbers needed for a
// MIRA GST return. Months use the issue date (tax point), not creation date.
export interface GstMonth {
  month: string;
  invoices: number;
  taxable_sales: number;
  gst: number;
  total: number;
}

export async function gstSummaryByMonth(): Promise<GstMonth[]> {
  const d = await connect();
  if (!d) return [];
  const r = await d.execute(
    `SELECT strftime('%Y-%m', COALESCE(issued_at, created_at)) AS month,
            COUNT(*) AS invoices,
            SUM(subtotal) AS taxable_sales,
            SUM(gst_amount) AS gst,
            SUM(total) AS total
     FROM invoices
     WHERE status IN ('Issued', 'Paid')
     GROUP BY month
     ORDER BY month DESC`
  );
  return r.rows.map((row) => ({
    month: String(row.month),
    invoices: Number(row.invoices),
    taxable_sales: Number(row.taxable_sales),
    gst: Number(row.gst),
    total: Number(row.total),
  }));
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
