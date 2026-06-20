"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { products, categories } from "@/data/products";
import { cn } from "@/lib/utils";

const tabs = ["All Categories", ...categories] as const;

export default function ShopPage() {
  const [active, setActive] = useState<(typeof tabs)[number]>("All Categories");
  const shown =
    active === "All Categories"
      ? products
      : products.filter((p) => p.category === active);

  return (
    <>
      <section className="relative border-b border-light-grey bg-white">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="container-tech relative py-12">
          <span className="label-mono text-primary">Product Catalog</span>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-charcoal md:text-4xl">
            Industrial Cooling Components
          </h1>
          <p className="mt-3 max-w-2xl accent-line text-on-surface-variant">
            Browse our catalog of VRFs, small water plants, spare parts, and
            controllers. Reveal a price, add to cart, and submit an order inquiry
            by email or WhatsApp.
          </p>
        </div>
      </section>

      <section className="container-tech py-10">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={cn(
                "rounded border px-4 py-2 text-sm font-medium transition-colors",
                active === t
                  ? "border-primary bg-primary text-white"
                  : "border-light-grey bg-white text-charcoal hover:border-primary hover:text-primary"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
