import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { getCatalogProductBySlug } from "@/lib/catalog";
import { ProductDetailActions } from "@/components/ProductDetailActions";

// Catalog is database-managed (see /admin/products) — render per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) return { title: "Product not found | Snow Engineering" };
  return {
    title: `${product.name} | Snow Engineering`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="container-tech py-10">
      <nav className="mb-6 flex items-center gap-1 text-sm text-steel">
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-charcoal">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="tech-card relative aspect-square bg-background">
          <ProductImage
            src={product.image}
            alt={product.name}
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
          />
        </div>

        <div>
          <span className="label-mono text-primary">{product.category}</span>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-charcoal">
            {product.name}
          </h1>
          <div className="label-mono mt-2 normal-case tracking-normal">
            {product.erpnextItemCode} · {product.stockStatus}
          </div>
          <p className="mt-4 text-on-surface-variant">{product.longDescription}</p>

          <div className="mt-6 rounded-lg border border-light-grey bg-white">
            <div className="border-b border-light-grey px-4 py-3">
              <span className="label-mono text-charcoal">Specifications</span>
            </div>
            <dl className="divide-y divide-light-grey">
              {product.specifications.map((s) => (
                <div key={s.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <dt className="text-steel">{s.label}</dt>
                  <dd className="font-mono text-charcoal">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-6">
            <ProductDetailActions product={product} />
          </div>

          <p className="label-mono mt-4 normal-case tracking-normal text-steel">
            Prices and availability are subject to confirmation. This generates an
            order inquiry, not a final invoice.
          </p>
        </div>
      </div>
    </div>
  );
}
