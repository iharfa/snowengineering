import { NextResponse } from "next/server";
import { orderPayloadSchema, buildOrderHtml } from "@/lib/order";
import { cartTotals } from "@/lib/cart";
import { erpnextConfigured, createWebsiteOrderInquiry } from "@/lib/erpnext";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  const parsed = orderPayloadSchema.safeParse(
    await req.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { customer, items } = parsed.data;
  const totals = cartTotals(items);

  // 1. Record inquiry in ERPNext (best effort).
  if (erpnextConfigured) {
    await createWebsiteOrderInquiry({
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
      source: "Website",
      status: "Open",
    }).catch((e) => console.error("ERPNext inquiry failed", e));
  }

  // 2. Email Snow Engineering.
  const to = process.env.SNOW_ORDER_EMAIL;
  if (!to) {
    return NextResponse.json(
      { error: "Order email not configured" },
      { status: 500 }
    );
  }
  try {
    const sent = await sendMail({
      to,
      replyTo: customer.email,
      subject: `New Website Order Inquiry from ${customer.name}`,
      html: buildOrderHtml(customer, items),
    });
    return NextResponse.json({ ok: true, emailed: sent });
  } catch (e) {
    console.error("send order email failed", e);
    return NextResponse.json({ error: "Email failed" }, { status: 502 });
  }
}
