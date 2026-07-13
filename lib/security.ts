// Shared request-hardening helpers for the public POST API routes.

// Parse a JSON body with a hard size cap so oversized payloads are rejected
// before JSON.parse. Returns null on any violation (caller responds 400).
export async function readJsonBody(
  req: Request,
  maxBytes = 64 * 1024
): Promise<unknown | null> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return null;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Cross-site request check. Browsers always send Origin on cross-origin POST
// and Sec-Fetch-Site on modern fetches; both must agree with our own host.
// Requests without these headers (curl, server-to-server) are allowed — the
// check is a CSRF/abuse speed bump, not an auth boundary.
export function sameOriginOk(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site && !["same-origin", "same-site", "none"].includes(site)) {
    return false;
  }
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
