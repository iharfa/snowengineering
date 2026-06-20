# Snow Engineering — Web

Production-ready Next.js site for **Snow Engineering**, a Maldives-based
refrigeration and engineering consultancy. Consultancy pages plus a lightweight
product catalog with a price-reveal flow, cart, and email/WhatsApp order
inquiries. Backend ERP is ERPNext; deployment target is Vercel.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · React Hook Form · Zod ·
Lucide · Nodemailer · ERPNext REST API · Vercel Analytics.

## Install

```bash
npm install
cp .env.example .env.local   # then fill in values (all optional for local dev)
npm run dev                  # http://localhost:3000
```

The site runs with **no configuration** — without ERPNext or SMTP it falls back
to local seed data (`data/products.ts`) and logs emails to the console instead
of sending them.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — serve the production build

## Environment variables

| Variable | Purpose |
|---|---|
| `ERPNEXT_BASE_URL` | ERPNext instance URL (e.g. `https://erp.example.com`) |
| `ERPNEXT_API_KEY` / `ERPNEXT_API_SECRET` | Token auth: `Authorization: token KEY:SECRET` |
| `ERPNEXT_PRICE_LIST` | Price list to read item prices from (default `Standard Selling`) |
| `SNOW_ORDER_EMAIL` | Inbox that receives order inquiries and contact messages |
| `NEXT_PUBLIC_SNOW_WHATSAPP_NUMBER` | WhatsApp number for click-to-send orders (digits, intl format) |
| `NEXT_PUBLIC_DEFAULT_GST_RATE` | Default GST rate %, default `8` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP for outbound email |

Anything prefixed `NEXT_PUBLIC_` is exposed to the browser. ERPNext and SMTP
credentials are **server-side only** and never reach the client.

## ERPNext setup

1. **Create a Client API key** (User → API Access → Generate Keys) and set
   `ERPNEXT_API_KEY` / `ERPNEXT_API_SECRET`.
2. **Items** — create Items with `show_in_website = 1` and matching
   `item_code`s. The site maps catalog products to ERPNext via
   `erpnextItemCode` in `data/products.ts`.
3. **Item Price** — add prices on the `ERPNEXT_PRICE_LIST` price list.
4. **Custom DocTypes** — create these two:

   **Website Price Reveal Log** — fields: `product_id`, `item_code`,
   `product_name`, `category`, `timestamp`, `session_id`, `user_agent`,
   `referrer`, `ip_hash`.

   **Website Order Inquiry** — fields: `customer_name`, `company`, `phone`,
   `email`, `location`, `preferred_contact_method`, `order_notes`, `cart_json`
   (Long Text), `subtotal`, `gst_amount`, `estimated_total`, `source`,
   `status`.

The site also creates **Lead** records from contact submissions. Quotations,
sales orders, and tax invoices are generated **inside ERPNext** — the website
only produces inquiries.

### ERPNext VPS notes

Run ERPNext on a VPS / DigitalOcean droplet behind Cloudflare. Point
`ERPNEXT_BASE_URL` at the public hostname, allow Vercel egress to reach it, and
keep API keys scoped to a dedicated integration user. Use HTTPS end-to-end.

## SMTP setup

Set the `SMTP_*` variables to any transactional mail provider (e.g. a
provider's relay, or your own mail server). `SMTP_FROM` should be a verified
sender. With SMTP unset, order/contact emails are skipped and logged to the
server console — useful for local development.

## WhatsApp setup

Set `NEXT_PUBLIC_SNOW_WHATSAPP_NUMBER` to the destination number in
international format (digits only, e.g. `9607777777`). Orders use a `wa.me`
click-to-send deep link — no messages are sent server-side.

## Branding

The logo lives at `public/snow-logo.svg`. To use a raster logo, drop
`public/snow-logo.png` in place and update the `src` in
`components/Header.tsx`. Product images default to
`public/products/placeholder.svg`; replace per-product via the `image` field in
`data/products.ts`.

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the environment variables above in **Project → Settings → Environment
   Variables**.
4. Deploy. The build command is `next build` (auto-detected).

## Notes

- Prices are never shipped in static JSON when ERPNext is configured — they are
  fetched server-side on price reveal.
- All prices and availability shown are estimates subject to confirmation; GST
  is estimated and final invoices are issued from ERPNext.
