"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RevealPriceButton } from "@/components/RevealPriceButton";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [revealed, setRevealed] = useState<{ price: number; gstRate: number } | null>(
    null
  );

  function addToCart() {
    add({
      id: product.id,
      slug: product.slug,
      name: product.name,
      erpnextItemCode: product.erpnextItemCode,
      price: revealed?.price ?? null,
      currency: product.currency,
      gstRate: revealed?.gstRate ?? product.gstRate,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="tech-card flex flex-col overflow-hidden">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square bg-background">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:768px) 100vw, 25vw"
            className="object-cover"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <span className="label-mono text-primary">{product.category}</span>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mt-1 font-heading text-base font-semibold leading-snug text-charcoal hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <ul className="mt-3 space-y-1">
          {product.specifications.slice(0, 3).map((s) => (
            <li key={s.label} className="label-mono normal-case tracking-normal">
              <span className="text-steel">{s.label}:</span>{" "}
              <span className="text-charcoal">{s.value}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4">
          <RevealPriceButton
            product={product}
            onReveal={(r) => setRevealed({ price: r.price, gstRate: r.gstRate })}
          />
          <Button className="mt-2 w-full" size="sm" onClick={addToCart}>
            {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {added ? "Added" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
