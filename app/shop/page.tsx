import type { Metadata } from "next";
import { ShopCatalog } from "@/components/ShopCatalog";
import { getCatalog, catalogCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop | Snow Engineering",
  description:
    "Browse VRFs, small water plants, spare parts, and controllers. Reveal prices and submit order inquiries by email or WhatsApp.",
};

// Catalog is database-managed (see /admin/products) — render per request.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getCatalog();
  const categories = catalogCategories(products);

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

      <ShopCatalog products={products} categories={categories} />
    </>
  );
}
