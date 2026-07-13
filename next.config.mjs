const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Third parties: Cloudflare Turnstile (script, frame,
// siteverify is server-side) and Vercel Analytics (same-origin /_vercel in
// prod; va.vercel-scripts.com serves the debug script in dev). Fonts are
// self-hosted via next/font. 'unsafe-inline' for scripts is required by
// Next.js bootstrap; 'unsafe-eval' and websockets only in dev (HMR).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${
    isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""
  }`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:", // https: for admin-entered product image URLs
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com${isDev ? " ws:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  poweredByHeader: false,
  // libSQL ships native bindings; keep it out of the webpack bundle.
  serverExternalPackages: ["@libsql/client"],
  // Images are served from /public only. If ERPNext-hosted product images are
  // added later, allowlist that specific host here — never use "**".
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
