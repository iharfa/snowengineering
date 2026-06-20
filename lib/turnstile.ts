// Cloudflare Turnstile server-side verification. Optional: when
// TURNSTILE_SECRET_KEY is unset, verification is skipped so local dev and
// keyless deploys keep working. Set the key (and NEXT_PUBLIC_TURNSTILE_SITE_KEY)
// in production to require a passing challenge on form submissions.

const SECRET = process.env.TURNSTILE_SECRET_KEY;
export const turnstileConfigured = Boolean(SECRET);

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string
): Promise<boolean> {
  if (!turnstileConfigured) return true; // not enforced when unconfigured
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: SECRET, response: token, remoteip: ip }),
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
