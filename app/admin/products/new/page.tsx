import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { ProductForm } from "@/app/admin/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { error } = await searchParams;

  return (
    <div className="tech-card max-w-3xl p-6">
      <Link href="/admin/products" className="text-xs text-steel underline hover:text-primary">
        ← Products
      </Link>
      <h2 className="mt-2 font-heading text-lg font-semibold text-charcoal">
        Add product
      </h2>
      <div className="mt-4">
        <ProductForm error={error} />
      </div>
    </div>
  );
}
