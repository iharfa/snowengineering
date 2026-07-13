// Server-side product catalog. Products live in the database (managed from
// /admin/products); the seed file data/products.ts is only the first-run
// import source and the fallback when the database is unreachable.

import type { Product } from "@/lib/types";
import { products as seedProducts } from "@/data/products";
import { dbListProducts } from "@/lib/db";

// dbListProducts returns null ONLY when the database is unreachable — that is
// the sole case where the seed fallback applies. A product missing from the
// database (archived/deleted) must not resurrect from the seed.
export async function getCatalog(): Promise<Product[]> {
  return (await dbListProducts()) ?? seedProducts;
}

export async function getCatalogProductBySlug(
  slug: string
): Promise<Product | null> {
  return (await getCatalog()).find((p) => p.slug === slug) ?? null;
}

export async function getCatalogProductByCode(
  code: string
): Promise<Product | null> {
  return (await getCatalog()).find((p) => p.erpnextItemCode === code) ?? null;
}

export function catalogCategories(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.category))];
}
