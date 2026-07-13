import { NextResponse } from "next/server";
import { orderPayloadSchema, buildOrderHtml } from "@/lib/order";
import { resolveOrderItems } from "@/lib/order-server";
import { cartTotals } from "@/lib/cart";
import { erpnextConfigured, createWebsiteOrderInquiry } from "@/lib/erpnext";
import { insertOrder, markOrderChannels } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { readJsonBody, sameOriginOk } from "@/lib/security";

export async function POST(req: Request) {
  if (!sameOriginOk(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = clientIp(req);
  const rl = await rateLimit(`order:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const parsed = orderPayloadSchema.safeParse(await readJsonBody(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { customer, turnstileToken, via } = parsed.data;

  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 403 }
    );
  }

  // Re-resolve every item server-side (catalog identity, live ERPNext price or
  // seed fallback). Client-supplied names/prices are never trusted.
  const resolved = await resolveOrderItems(parsed.data.items);
  if (!resolved.ok) {
    return NextResponse.json(
      { error: "Unknown items in cart", unknownCodes: resolved.unknownCodes },
      { status: 400 }
    );
  }
  const items = resolved.items;
  const totals = cartTotals(items);

  // 1. Record in the local database — the primary sales-tracking record.
  let orderId: number | null = null;
  try {
    orderId = await insertOrder({
      via,
      customer_name: customer.name,
      company: customer.company,
      phone: customer.phone,
      email: customer.email,
      location: customer.location,
      preferred_contact: customer.preferredContact,
      order_notes: customer.orderNotes,
      items,
      subtotal: totals.subtotal,
      gst_amount: totals.gstAmount,
      total: totals.total,
    });
  } catch (e) {
    console.error("local order insert failed", e);
  }

  // 2. Mirror to ERPNext when configured (best effort).
  let recorded = false;
  if (erpnextConfigured) {
    const doc = await createWebsiteOrderInquiry({
      customer_name: customer.name,
      company: customer.company,
      phone: customer.phone,
      email: customer.email,
      location: customer.location,
      preferred_contact_method: customer.preferredContact,
      order_notes: customer.orderNotes,
      cart_json: JSON.stringify(items),
      subtotal: totals.subtotal,
      gst_amount: totals.gstAmount,
      estimated_total: totals.total,
      source: via === "whatsapp" ? "Website WhatsApp" : "Website",
      status: "Open",
    }).catch((e) => {
      console.error("ERPNext inquiry failed", e);
      return null;
    });
    recorded = Boolean(doc);
  }

  // 3. Email Snow Engineering. For WhatsApp orders the customer's message is
  // the primary channel, so the email is only sent as a backup record when
  // ERPNext didn't capture the inquiry.
  const to = process.env.SNOW_ORDER_EMAIL;
  let emailed = false;
  if (to && (via === "email" || !recorded)) {
    const channel = via === "whatsapp" ? "WhatsApp" : "Website";
    try {
      emailed = await sendMail({
        to,
        replyTo: customer.email,
        subject: `New ${channel} Order Inquiry from ${customer.name.replace(
          /[\r\n]/g,
          " "
        )}`,
        html: buildOrderHtml(customer, items),
      });
    } catch (e) {
      console.error("send order email failed", e);
    }
  }

  if (orderId != null) {
    await markOrderChannels(orderId, recorded, emailed).catch((e) =>
      console.error("mark order channels failed", e)
    );
  }

  // A WhatsApp order already reached the business via the customer's own
  // message; for email orders, fail loudly if nothing captured the inquiry so
  // the customer keeps their cart and can retry.
  const captured =
    orderId != null ||
    recorded ||
    emailed ||
    process.env.NODE_ENV !== "production";
  if (via === "email" && !captured) {
    return NextResponse.json(
      { error: "Order could not be delivered. Please try WhatsApp." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, orderId, recorded, emailed });
}
