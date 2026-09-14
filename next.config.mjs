/** @type {import('next').NextConfig} */

// Response security headers (brief §32). Applied to every route. CSP keeps
// `script-src 'unsafe-inline'` for now — Next's hydration bootstrap and the
// pre-paint ThemeScript are inline; moving to a nonce needs middleware wiring
// and is tracked in docs/SECURITY.md. The other directives (frame-ancestors,
// object-src, base-uri, form-action) already close the main injection vectors.
const isDev = process.env.NODE_ENV !== "production";

// In production, Vercel Analytics / Speed Insights are served same-origin from
// /_vercel/* (covered by 'self'). Only the dev build pulls the debug scripts and
// the HMR socket from elsewhere, so those exceptions are dev-only.
const devScript = isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : "";
const devConnect = isDev ? " ws: wss: https://va.vercel-scripts.com https://vitals.vercel-insights.com" : "";

// Object storage (lib/storage.ts): uploads PUT straight from the browser to a
// presigned URL, and photo/video playback loads straight from a signed GET
// URL — neither is proxied through this app, so the storage provider's host
// needs allowing here or the browser blocks both (a CSP block looks
// identical to a real network failure / broken image, easy to mistake for a
// CORS or credentials problem). R2's presigned URLs are virtual-hosted-style
// (`<bucket>.<account-id>.r2.cloudflarestorage.com`), so this wildcards the
// whole r2.cloudflarestorage.com host rather than hardcoding one bucket.
const storageHost = process.env.STORAGE_ENDPOINT
  ? ` ${process.env.STORAGE_ENDPOINT}`
  : process.env.R2_ACCOUNT_ID
    ? " https://*.r2.cloudflarestorage.com"
    : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devScript}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${storageHost}`,
  "font-src 'self'",
  `connect-src 'self'${devConnect}${storageHost}`,
  `media-src 'self' blob:${storageHost}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    // camera=self so the QR check-in screen can use it; everything else off.
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
