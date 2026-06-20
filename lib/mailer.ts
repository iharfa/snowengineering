import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

export const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!smtpConfigured) {
    console.warn("SMTP not configured — email not sent:", opts.subject);
    return false;
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transport.sendMail({
    from: SMTP_FROM || SMTP_USER,
    ...opts,
  });
  return true;
}
