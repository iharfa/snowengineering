// Server-only order helpers. Never import into a client component (pulls in
// lib/erpnext). The client's cart is treated as a list of (item code, qty)
// requests — names, prices, GST rates, and currency are always re-resolved
// here from the catalog / ERPNext so tampered client values never reach the
// sales record or the order email.

import type { CartItem, Product } from "@/lib/types";
import { getProductByCode } from "@/data/products";
import { erpnextConfigured, getItemPrice } from "@/lib/erpnext";
import { getProductOverride } from "@/lib/db";

// Price precedence: admin override (set in /admin/products) → live ERPNext
// price → seed catalog fallback.
export async function resolveProductPrice(seed: Product): Promise<number | null> {
  const override = await getProductOverride(seed.erpnextItemCode);
  if (override?.price != null) return override.price;
  if (erpnextConfigured) {
    const live = await getItemPrice(seed.erpnextItemCode);
    if (live != null) return live;
  }
  return seed.price ?? null;
}

export type ResolvedOrder =
  | { ok: true; items: CartItem[] }
  | { ok: false; unknownCodes: string[] };

export async function resolveOrderItems(
  items: { erpnextItemCode: string; quantity: number }[]
): Promise<ResolvedOrder> {
  const unknownCodes: string[] = [];

  // Merge duplicate item codes (summing quantities) so a hostile payload of
  // many repeated lines can't fan out into one upstream price fetch per line.
  const merged = new Map<string, number>();
  for (const i of items) {
    const qty = (merged.get(i.erpnextItemCode) ?? 0) + i.quantity;
    merged.set(i.erpnextItemCode, Math.min(qty, 9_999));
  }

  const resolved = await Promise.all(
    [...merged.entries()].map(async ([code, quantity]): Promise<CartItem | null> => {
      const seed = getProductByCode(code);
      if (!seed) {
        unknownCodes.push(code);
        return null;
      }
      const price = await resolveProductPrice(seed);
      return {
        id: seed.id,
        slug: seed.slug,
        name: seed.name,
        erpnextItemCode: seed.erpnextItemCode,
        quantity,
        price,
        currency: seed.currency,
        gstRate: seed.gstRate,
      };
    })
  );

  if (unknownCodes.length) return { ok: false, unknownCodes };
  return { ok: true, items: resolved.filter((i): i is CartItem => i !== null) };
}
