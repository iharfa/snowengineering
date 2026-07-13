"use server";

// Server actions for the /admin backend. Every mutating action re-checks the
// admin session — never rely on the page guard alone.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  adminConfigured,
  isAdmin,
  sessionToken,
  verifyPassword,
} from "@/lib/admin-auth";
import {
  LEAD_STATUSES,
  ORDER_STATUSES,
  updateLeadStatus,
  updateOrderStatus,
  upsertProductOverride,
  type LeadStatus,
  type OrderStatus,
} from "@/lib/db";
import { getProductByCode } from "@/data/products";
import { rateLimit } from "@/lib/ratelimit";

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

export async function saveProductOverrideAction(formData: FormData) {
  await guard();
  const itemCode = String(formData.get("item_code") ?? "");
  if (!getProductByCode(itemCode)) redirect("/admin/products");

  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw === "" ? null : Number(priceRaw);
  const stockRaw = String(formData.get("stock_status") ?? "");
  const validStock = ["In Stock", "Made to Order", "On Request"];

  await upsertProductOverride({
    item_code: itemCode,
    price: price != null && Number.isFinite(price) && price >= 0 ? price : null,
    stock_status: validStock.includes(stockRaw) ? stockRaw : null,
    is_price_hidden: null, // visibility stays governed by the seed catalog for now
  });
  revalidatePath("/admin/products");
}
