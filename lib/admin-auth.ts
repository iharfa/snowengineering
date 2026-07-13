// Cookie auth for the /admin backend. Single shared password (ADMIN_PASSWORD
// env var); the session cookie stores an HMAC derived from it, so rotating the
// password invalidates every session. When ADMIN_PASSWORD is unset the admin
// area stays locked and shows setup instructions instead.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "snow-admin";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

function password(): string | undefined {
  return process.env.ADMIN_PASSWORD || undefined;
}

export function adminConfigured(): boolean {
  return Boolean(password());
}

function sign(exp: number, pw: string): string {
  return createHmac("sha256", pw)
    .update(`snow-admin-session-v1:${exp}`)
    .digest("hex");
}

// Token format: "<unix-expiry>.<hmac>". Expiry is inside the signed payload,
// so it is enforced server-side (cookie maxAge alone is client-enforced) and
// cannot be extended by editing the cookie.
export function sessionToken(): string | null {
  const pw = password();
  if (!pw) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_S;
  return `${exp}.${sign(exp, pw)}`;
}

export function verifyPassword(attempt: string): boolean {
  const pw = password();
  if (!pw) return false;
  const a = Buffer.from(attempt);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  // Read cookies first: it also opts the calling page into dynamic rendering,
  // so admin pages are never statically prerendered with a baked-in redirect.
  const got = (await cookies()).get(ADMIN_COOKIE)?.value;
  const pw = password();
  if (!pw || !got) return false;

  const dot = got.indexOf(".");
  if (dot < 1) return false;
  const exp = Number(got.slice(0, dot));
  if (!Number.isInteger(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }
  const a = Buffer.from(got.slice(dot + 1));
  const b = Buffer.from(sign(exp, pw));
  return a.length === b.length && timingSafeEqual(a, b);
}
