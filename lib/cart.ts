import type { CartItem } from "@/lib/types";

export function cartTotals(items: CartItem[]) {
  let subtotal = 0;
  let gstAmount = 0;
  let pendingReveal = 0;

  for (const i of items) {
    if (i.price == null) {
      pendingReveal += 1;
      continue;
    }
    const line = i.price * i.quantity;
    subtotal += line;
    gstAmount += line * (i.gstRate / 100);
  }

  return {
    subtotal,
    gstAmount,
    total: subtotal + gstAmount,
    pendingReveal,
  };
}
