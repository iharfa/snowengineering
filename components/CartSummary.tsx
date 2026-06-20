"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { Button } from "@/components/ui/button";
import { formatMVR } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

export function CartSummary() {
  const { items, setQty, remove, setPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="tech-card p-10 text-center">
        <p className="text-on-surface-variant">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block">
          <Button variant="secondary">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="tech-card flex gap-4 p-4">
          <div className="relative h-20 w-20 flex-shrink-0 rounded bg-background">
            <Image
              src="/products/placeholder.svg"
              alt={item.name}
              fill
              sizes="80px"
              className="object-contain p-2"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <Link
              href={`/shop/${item.slug}`}
              className="font-heading font-semibold text-charcoal hover:text-primary"
            >
              {item.name}
            </Link>
            <span className="label-mono normal-case tracking-normal">
              {item.erpnextItemCode}
            </span>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center rounded border border-light-grey">
                <button
                  className="px-2 py-1.5 hover:bg-light-grey/30"
                  onClick={() => setQty(item.id, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center font-mono text-sm">
                  {item.quantity}
                </span>
                <button
                  className="px-2 py-1.5 hover:bg-light-grey/30"
                  onClick={() => setQty(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <PriceCell item={item} onReveal={setPrice} />

              <button
                className="text-steel hover:text-primary"
                onClick={() => remove(item.id)}
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PriceCell({
  item,
  onReveal,
}: {
  item: CartItem;
  onReveal: (id: string, price: number, gstRate: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (item.price != null) {
    return (
      <span className="font-mono text-sm text-charcoal">
        {formatMVR(item.price * item.quantity, item.currency)}
      </span>
    );
  }

  async function reveal() {
    setLoading(true);
    try {
      const res = await fetch("/api/price-reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          itemCode: item.erpnextItemCode,
          productName: item.name,
          category: "cart",
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          sessionId: "cart",
        }),
      });
      const data = await res.json();
      onReveal(item.id, data.price, data.gstRate);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={reveal} disabled={loading}>
      <Eye className="h-3.5 w-3.5" />
      {loading ? "…" : "Reveal price"}
    </Button>
  );
}
