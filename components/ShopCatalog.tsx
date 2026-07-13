"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ShopCatalog({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const tabs = ["All Categories", ...categories];
  const [active, setActive] = useState("All Categories");
  const shown =
    active === "All Categories"
      ? products
      : products.filter((p) => p.category === active);

  return (
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
  );
}
