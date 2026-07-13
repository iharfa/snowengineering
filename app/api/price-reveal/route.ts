import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { getProductByCode } from "@/data/products";
import { erpnextConfigured, createPriceRevealLog } from "@/lib/erpnext";
import { resolveProductPrice } from "@/lib/order-server";
import { insertPriceReveal } from "@/lib/db";
import { DEFAULT_GST_RATE } from "@/lib/utils";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { readJsonBody, sameOriginOk } from "@/lib/security";

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
  if (!sameOriginOk(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = clientIp(req);
  const rl = await rateLimit(`reveal:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const parsed = schema.safeParse(await readJsonBody(req, 8 * 1024));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Only catalog products can be priced — this endpoint must not let callers
  // read arbitrary ERPNext item prices by guessing item codes.
  const seed = getProductByCode(data.itemCode);
  if (!seed) {
    return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  }
  const gstRate = seed.gstRate ?? DEFAULT_GST_RATE;
  const currency = seed.currency ?? "MVR";

  // Admin override → live ERPNext price → seed fallback.
  const price = await resolveProductPrice(seed);
  if (price == null) {
    return NextResponse.json({ error: "Price unavailable" }, { status: 404 });
  }

  // Audit log: local DB always; ERPNext mirror best-effort. Never block the
  // response on either.
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const category = data.category === "cart" ? "cart" : seed.category;
  try {
    await insertPriceReveal({
      item_code: seed.erpnextItemCode,
      product_name: seed.name,
      category,
      session_id: data.sessionId,
      user_agent: data.userAgent,
      referrer: data.referrer,
      ip_hash: ipHash,
    });
  } catch (e) {
    console.error("local reveal log failed", e);
  }
  if (erpnextConfigured) {
    createPriceRevealLog({
      // Identity fields come from the catalog, not the request body. "cart"
      // is kept as a category marker for reveals made from the cart page.
      product_id: seed.id,
      item_code: seed.erpnextItemCode,
      product_name: seed.name,
      category,
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
