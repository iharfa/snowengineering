import { NextResponse } from "next/server";
import { z } from "zod";
import { erpnextConfigured, createLeadFromInquiry } from "@/lib/erpnext";
import { insertLead } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { readJsonBody, sameOriginOk } from "@/lib/security";

const schema = z.object({
  name: z.string().min(2).max(120),
  company: z.string().max(160).optional(),
  email: z.string().email().max(200),
  phone: z.string().min(5).max(40),
  message: z.string().min(10).max(5000),
  turnstileToken: z.string().max(2048).optional(),
});

export async function POST(req: Request) {
  if (!sameOriginOk(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = clientIp(req);
  const rl = await rateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const parsed = schema.safeParse(await readJsonBody(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await verifyTurnstile(d.turnstileToken, ip))) {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Record in the local database first — the primary CRM record.
  let leadId: number | null = null;
  try {
    leadId = await insertLead({
      name: d.name,
      company: d.company,
      email: d.email,
      phone: d.phone,
      message: d.message,
    });
  } catch (e) {
    console.error("local lead insert failed", e);
  }

  let leadCreated = false;
  if (erpnextConfigured) {
    const lead = await createLeadFromInquiry({
      lead_name: d.name,
      company_name: d.company,
      email_id: d.email,
      mobile_no: d.phone,
    }).catch((e) => {
      console.error("Lead creation failed", e);
      return null;
    });
    leadCreated = Boolean(lead);
  }

  const to = process.env.SNOW_ORDER_EMAIL;
  let emailed = false;
  if (to) {
    try {
      emailed = await sendMail({
        to,
        replyTo: d.email,
        subject: `Website Contact — ${d.name.replace(/[\r\n]/g, " ")}`,
        html: `<p><strong>${esc(d.name)}</strong>${
          d.company ? ` (${esc(d.company)})` : ""
        }</p>
        <p>Email: ${esc(d.email)}<br/>Phone: ${esc(d.phone)}</p>
        <p>${esc(d.message).replace(/\n/g, "<br/>")}</p>`,
      });
    } catch (e) {
      console.error("contact email failed", e);
    }
  }

  // Never claim success for a message nobody will see.
  if (
    leadId == null &&
    !leadCreated &&
    !emailed &&
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.json(
      { error: "Message could not be delivered. Please call or WhatsApp us." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
