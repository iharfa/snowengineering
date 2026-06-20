"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealPriceButton } from "@/components/RevealPriceButton";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/types";

export function ProductDetailActions({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [revealed, setRevealed] = useState<{ price: number; gstRate: number } | null>(
    null
  );

  function addToCart() {
    add(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        erpnextItemCode: product.erpnextItemCode,
        price: revealed?.price ?? null,
        currency: product.currency,
        gstRate: revealed?.gstRate ?? product.gstRate,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      <RevealPriceButton
        product={product}
        onReveal={(r) => setRevealed({ price: r.price, gstRate: r.gstRate })}
      />
      <div className="flex items-center gap-3">
        <label className="label-mono">Qty</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          className="h-11 w-20 rounded border border-light-grey px-3 text-center font-mono text-sm focus:border-2 focus:border-primary focus:outline-none"
        />
        <Button onClick={addToCart} className="flex-1">
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {added ? "Added to cart" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
