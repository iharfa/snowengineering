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
      subject: `Website Contact — ${d.name}`,
      html: `<p><strong>${d.name}</strong>${
        d.company ? ` (${d.company})` : ""
      }</p>
        <p>Email: ${d.email}<br/>Phone: ${d.phone}</p>
        <p>${d.message.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`,
    }).catch((e) => console.error("contact email failed", e));
  }

  return NextResponse.json({ ok: true });
}
