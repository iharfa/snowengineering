import { z } from "zod";
import type { CartItem } from "@/lib/types";
import { cartTotals } from "@/lib/cart";
import { formatMVR } from "@/lib/utils";

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Valid email required"),
  location: z.string().min(2, "Island / delivery location is required"),
  preferredContact: z.enum(["Email", "WhatsApp", "Phone"]),
  orderNotes: z.string().optional(),
});

export type Customer = z.infer<typeof customerSchema>;

const cartItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  erpnextItemCode: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nullable(),
  currency: z.string(),
  gstRate: z.number(),
});

export const orderPayloadSchema = z.object({
  customer: customerSchema,
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
});

export type OrderPayload = z.infer<typeof orderPayloadSchema>;

const DELIVERY_NOTE =
  "Delivery and handling charges may apply depending on item size and destination. Prices and availability are subject to confirmation.";

export function buildOrderText(customer: Customer, items: CartItem[]) {
  const t = cartTotals(items);
  const lines: string[] = [];
  lines.push("NEW WEBSITE ORDER INQUIRY — Snow Engineering");
  lines.push("");
  lines.push(`Name: ${customer.name}`);
  if (customer.company) lines.push(`Company: ${customer.company}`);
  lines.push(`Phone: ${customer.phone}`);
  lines.push(`Email: ${customer.email}`);
  lines.push(`Location: ${customer.location}`);
  lines.push(`Preferred contact: ${customer.preferredContact}`);
  lines.push("");
  lines.push("Items:");
  for (const i of items) {
    const price =
      i.price != null
        ? formatMVR(i.price * i.quantity, i.currency)
        : "price on confirmation";
    lines.push(`- ${i.quantity} x ${i.name} (${i.erpnextItemCode}) — ${price}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${formatMVR(t.subtotal)}`);
  lines.push(`Estimated GST: ${formatMVR(t.gstAmount)}`);
  lines.push(`Estimated total: ${formatMVR(t.total)}`);
  if (t.pendingReveal > 0)
    lines.push(`(${t.pendingReveal} item(s) priced on confirmation)`);
  lines.push("");
  if (customer.orderNotes) {
    lines.push(`Notes: ${customer.orderNotes}`);
    lines.push("");
  }
  lines.push(DELIVERY_NOTE);
  return lines.join("\n");
}

export function buildOrderHtml(customer: Customer, items: CartItem[]) {
  return `<pre style="font-family:ui-monospace,monospace;font-size:13px">${buildOrderText(
    customer,
    items
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")}</pre>`;
}

export function whatsappLink(
  number: string,
  customer: Customer,
  items: CartItem[]
) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    buildOrderText(customer, items)
  )}`;
}

export { DELIVERY_NOTE };
