"use server";

// Server actions for the /admin backend. Every mutating action re-checks the
// admin session — never rely on the page guard alone.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  adminConfigured,
  isAdmin,
  sessionToken,
  verifyPassword,
} from "@/lib/admin-auth";
import {
  INVOICE_STATUSES,
  LEAD_STATUSES,
  ORDER_STATUSES,
  dbCreateProduct,
  dbGetProduct,
  dbSetProductActive,
  dbUpdateProduct,
  getOrder,
  insertInvoice,
  updateInvoiceStatus,
  updateLeadStatus,
  updateOrderStatus,
  type InvoiceStatus,
  type LeadStatus,
  type OrderStatus,
} from "@/lib/db";
import { resolveOrderItems } from "@/lib/order-server";
import { cartTotals } from "@/lib/cart";
import { rateLimit } from "@/lib/ratelimit";
import type { CartItem } from "@/lib/types";

export async function loginAction(formData: FormData) {
  if (!adminConfigured()) redirect("/admin/login?error=unconfigured");

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const rl = await rateLimit(`admin-login:${ip}`, 10, 60_000);
  if (!rl.ok) redirect("/admin/login?error=rate");

  const attempt = String(formData.get("password") ?? "");
  if (!verifyPassword(attempt)) redirect("/admin/login?error=bad");

  const token = sessionToken();
  if (!token) redirect("/admin/login?error=unconfigured");
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_S,
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// --- orders / leads -----------------------------------------------------------

export async function setOrderStatusAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (Number.isInteger(id) && ORDER_STATUSES.includes(status)) {
    await updateOrderStatus(id, status);
  }
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function setLeadStatusAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as LeadStatus;
  if (Number.isInteger(id) && LEAD_STATUSES.includes(status)) {
    await updateLeadStatus(id, status);
  }
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

// --- products ------------------------------------------------------------------

const productSchema = z.object({
  item_code: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Za-z0-9._-]+$/, "Item code: letters, numbers, . _ - only"),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().max(120),
  category: z.string().trim().min(2).max(80),
  short_description: z.string().trim().max(300),
  long_description: z.string().trim().max(5000),
  image: z.string().trim().max(500),
  specifications: z.string().max(2000),
  stock_status: z.enum(["In Stock", "Made to Order", "On Request"]),
  price: z.coerce.number().min(0).max(100_000_000),
  gst_rate: z.coerce.number().min(0).max(100),
  is_price_hidden: z.coerce.boolean(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function parseSpecs(text: string): { label: string; value: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const i = line.indexOf(":");
      if (i < 1) return { label: line.slice(0, 60), value: "" };
      return {
        label: line.slice(0, i).trim().slice(0, 60),
        value: line.slice(i + 1).trim().slice(0, 120),
      };
    });
}

export async function saveProductAction(formData: FormData) {
  await guard();
  const mode = String(formData.get("mode")); // "create" | "update"
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const msg = encodeURIComponent(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
    redirect(
      mode === "create"
        ? `/admin/products/new?error=${msg}`
        : `/admin/products/${formData.get("item_code")}?error=${msg}`
    );
  }
  const d = parsed.data;
  const image =
    d.image === "" ||
    d.image.startsWith("/") ||
    d.image.startsWith("https://")
      ? d.image || "/products/placeholder.svg"
      : "/products/placeholder.svg";

  const input = {
    slug: d.slug ? slugify(d.slug) : slugify(d.name) || d.item_code.toLowerCase(),
    name: d.name,
    category: d.category,
    short_description: d.short_description,
    long_description: d.long_description,
    image,
    specifications: parseSpecs(d.specifications),
    stock_status: d.stock_status,
    price: d.price,
    gst_rate: d.gst_rate,
    is_price_hidden: d.is_price_hidden,
  };

  if (mode === "create") {
    if (await dbGetProduct("item_code", d.item_code)) {
      redirect(`/admin/products/new?error=${encodeURIComponent("Item code already exists")}`);
    }
    await dbCreateProduct({ item_code: d.item_code, ...input });
  } else {
    await dbUpdateProduct(d.item_code, input);
  }
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function setProductActiveAction(formData: FormData) {
  await guard();
  const code = String(formData.get("item_code") ?? "");
  const active = String(formData.get("active")) === "1";
  if (code) await dbSetProductActive(code, active);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

// --- invoices ------------------------------------------------------------------

export async function createInvoiceFromOrderAction(formData: FormData) {
  await guard();
  const orderId = Number(formData.get("order_id"));
  if (!Number.isInteger(orderId)) redirect("/admin/orders");
  const order = await getOrder(orderId);
  if (!order) redirect("/admin/orders");

  let items: CartItem[] = [];
  try {
    items = JSON.parse(order.items_json) as CartItem[];
  } catch {
    redirect("/admin/orders");
  }

  // Re-resolve against the current catalog so any prices that were pending at
  // order time (or changed since) are current. If an item no longer exists in
  // the catalog, keep the snapshot from the order.
  const resolved = await resolveOrderItems(
    items.map((i) => ({ erpnextItemCode: i.erpnextItemCode, quantity: i.quantity }))
  );
  if (resolved.ok) items = resolved.items;

  const totals = cartTotals(items);
  const invoiceId = await insertInvoice({
    order_id: order.id,
    customer_name: order.customer_name,
    company: order.company,
    phone: order.phone,
    email: order.email,
    location: order.location,
    items,
    subtotal: totals.subtotal,
    gst_amount: totals.gstAmount,
    total: totals.total,
    notes: order.order_notes,
  });
  revalidatePath("/admin/invoices");
  redirect(invoiceId != null ? `/admin/invoices/${invoiceId}` : "/admin/orders");
}

export async function setInvoiceStatusAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as InvoiceStatus;
  if (Number.isInteger(id) && INVOICE_STATUSES.includes(status)) {
    await updateInvoiceStatus(id, status);
  }
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  revalidatePath("/admin/tax");
}
