import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { dbGetProduct } from "@/lib/db";
import { ProductForm } from "@/app/admin/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { code } = await params;
  const { error } = await searchParams;
  const product = await dbGetProduct("item_code", decodeURIComponent(code));
  if (!product) notFound();

  return (
    <div className="tech-card max-w-3xl p-6">
      <Link href="/admin/products" className="text-xs text-steel underline hover:text-primary">
        ← Products
      </Link>
      <h2 className="mt-2 font-heading text-lg font-semibold text-charcoal">
        Edit: {product.name}
      </h2>
      <div className="mt-4">
        <ProductForm product={product} error={error} />
      </div>
    </div>
  );
}
