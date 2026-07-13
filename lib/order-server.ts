// Server-only order helpers. Never import into a client component (pulls in
// lib/erpnext). The client's cart is treated as a list of (item code, qty)
// requests — names, prices, GST rates, and currency are always re-resolved
// here from the catalog / ERPNext so tampered client values never reach the
// sales record or the order email.

import type { CartItem, Product } from "@/lib/types";
import { getCatalogProductByCode } from "@/lib/catalog";
import { erpnextConfigured, getItemPrice } from "@/lib/erpnext";

// Price precedence: the database catalog price (managed in /admin/products)
// is authoritative; live ERPNext is consulted only if the catalog has no
// price set for the item.
export async function resolveProductPrice(product: Product): Promise<number | null> {
  if (product.price > 0) return product.price;
  if (erpnextConfigured) {
    const live = await getItemPrice(product.erpnextItemCode);
    if (live != null) return live;
  }
  return null;
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
      const product = await getCatalogProductByCode(code);
      if (!product) {
        unknownCodes.push(code);
        return null;
      }
      const price = await resolveProductPrice(product);
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        erpnextItemCode: product.erpnextItemCode,
        quantity,
        price,
        currency: product.currency,
        gstRate: product.gstRate,
      };
    })
  );

  if (unknownCodes.length) return { ok: false, unknownCodes };
  return { ok: true, items: resolved.filter((i): i is CartItem => i !== null) };
}
