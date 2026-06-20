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
import { rateLimit, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  productId: z.string().max(100),
  itemCode: z.string().max(100),
  productName: z.string().max(200),
  category: z.string().max(80),
  timestamp: z.string().max(40),
  userAgent: z.string().max(512).optional().default(""),
  referrer: z.string().max(512).optional().default(""),
  sessionId: z.string().max(100),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`reveal:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

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
