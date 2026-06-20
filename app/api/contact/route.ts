import { NextResponse } from "next/server";
import { z } from "zod";
import { erpnextConfigured, createLeadFromInquiry } from "@/lib/erpnext";
import { sendMail } from "@/lib/mailer";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(5),
  message: z.string().min(10),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const d = parsed.data;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (erpnextConfigured) {
    createLeadFromInquiry({
      lead_name: d.name,
      company_name: d.company,
      email_id: d.email,
      mobile_no: d.phone,
    }).catch((e) => console.error("Lead creation failed", e));
  }

  const to = process.env.SNOW_ORDER_EMAIL;
  if (to) {
    await sendMail({
      to,
      replyTo: d.email,
      subject: `Website Contact — ${d.name.replace(/[\r\n]/g, " ")}`,
      html: `<p><strong>${esc(d.name)}</strong>${
        d.company ? ` (${esc(d.company)})` : ""
      }</p>
        <p>Email: ${esc(d.email)}<br/>Phone: ${esc(d.phone)}</p>
        <p>${esc(d.message).replace(/\n/g, "<br/>")}</p>`,
    }).catch((e) => console.error("contact email failed", e));
  }

  return NextResponse.json({ ok: true });
}
