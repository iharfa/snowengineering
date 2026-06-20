/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  // Images are served from /public only. If ERPNext-hosted product images are
  // added later, allowlist that specific host here — never use "**".
};

export default nextConfig;
