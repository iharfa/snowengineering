import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { getProductByCode } from "@/data/products";
import {
  erpnextConfigured,
  getItemPrice,
  createPriceRevealLog,
} from "@/lib/erpnext";
import { DEFAULT_GST_RATE } from "@/lib/utils";

const schema = z.object({
  productId: z.string(),
  itemCode: z.string(),
  productName: z.string(),
  category: z.string(),
  timestamp: z.string(),
  userAgent: z.string().optional().default(""),
  referrer: z.string().optional().default(""),
  sessionId: z.string(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const seed = getProductByCode(data.itemCode);
  const gstRate = seed?.gstRate ?? DEFAULT_GST_RATE;
  const currency = seed?.currency ?? "MVR";

  // Live ERPNext price if configured, else local seed fallback.
  let price: number | null = null;
  if (erpnextConfigured) price = await getItemPrice(data.itemCode);
  if (price == null) price = seed?.price ?? null;

  if (price == null) {
    return NextResponse.json({ error: "Price unavailable" }, { status: 404 });
  }

  // Fire-and-forget audit log; never block the response on it.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  if (erpnextConfigured) {
    createPriceRevealLog({
      product_id: data.productId,
      item_code: data.itemCode,
      product_name: data.productName,
      category: data.category,
      timestamp: data.timestamp,
      session_id: data.sessionId,
      user_agent: data.userAgent,
      referrer: data.referrer,
      ip_hash: ipHash,
    }).catch(() => {});
  }

  const gstAmount = price * (gstRate / 100);
  return NextResponse.json({
    price,
    currency,
    gstRate,
    gstAmount,
    estimatedTotal: price + gstAmount,
  });
}
