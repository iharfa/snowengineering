import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { dbListProducts } from "@/lib/db";
import { setProductActiveAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { formatMVR } from "@/lib/utils";

// Live business data + cookie auth — never prerender.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const products = await dbListProducts(true);

  if (!products) {
    return (
      <div className="tech-card p-8">
        <p className="text-sm" style={{ color: "#ba1a1a" }}>
          The database is unavailable, so products cannot be managed right now.
          The shop is serving the built-in seed catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="tech-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-charcoal">
            Products
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Changes take effect on the shop immediately. Archived products stay
            on past orders and invoices but disappear from the shop.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm">+ Add product</Button>
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="label-mono border-b border-light-grey">
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Item code</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">GST</th>
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.erpnextItemCode}
                className={`border-b border-light-grey/60 ${p.active ? "" : "opacity-50"}`}
              >
                <td className="py-2 pr-4 text-charcoal">
                  {p.name}
                  {!p.active && <span className="label-mono ml-2">archived</span>}
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{p.erpnextItemCode}</td>
                <td className="py-2 pr-4 text-xs">{p.category}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  {formatMVR(p.price, p.currency)}
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{p.gstRate}%</td>
                <td className="py-2 pr-4 text-xs">{p.stockStatus}</td>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${p.erpnextItemCode}`}
                      className="text-xs text-steel underline hover:text-primary"
                    >
                      Edit
                    </Link>
                    <form action={setProductActiveAction}>
                      <input type="hidden" name="item_code" value={p.erpnextItemCode} />
                      <input type="hidden" name="active" value={p.active ? "0" : "1"} />
                      <button className="text-xs text-steel underline hover:text-primary">
                        {p.active ? "Archive" : "Restore"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
