import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { listProductOverrides } from "@/lib/db";
import { products } from "@/data/products";
import { saveProductOverrideAction } from "@/app/admin/actions";
import { formatMVR } from "@/lib/utils";

const STOCK_OPTIONS = ["In Stock", "Made to Order", "On Request"];

// Live business data + cookie auth — never prerender.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const overrides = new Map(
    (await listProductOverrides()).map((o) => [o.item_code, o])
  );

  return (
    <div className="tech-card p-6">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        Products — price &amp; stock
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Overrides set here take effect immediately on the shop (price reveals
        and order pricing) without a code deploy. Leave a field blank to fall
        back to ERPNext / the seed catalog. Descriptions and images are edited
        in <code className="font-mono">data/products.ts</code>.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="label-mono border-b border-light-grey">
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Item code</th>
              <th className="py-2 pr-4">Seed price</th>
              <th className="py-2 pr-4">Override price (MVR)</th>
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const o = overrides.get(p.erpnextItemCode);
              return (
                <tr key={p.id} className="border-b border-light-grey/60">
                  <td className="py-2 pr-4 text-charcoal">{p.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {p.erpnextItemCode}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {formatMVR(p.price, p.currency)}
                  </td>
                  <td className="py-2 pr-4" colSpan={3}>
                    <form
                      action={saveProductOverrideAction}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="item_code"
                        value={p.erpnextItemCode}
                      />
                      <input
                        type="number"
                        name="price"
                        min={0}
                        step="0.01"
                        defaultValue={o?.price ?? ""}
                        placeholder="—"
                        className="h-8 w-32 rounded border border-light-grey bg-background px-2 font-mono text-xs"
                      />
                      <select
                        name="stock_status"
                        defaultValue={o?.stock_status ?? ""}
                        className="h-8 rounded border border-light-grey bg-background px-2 text-xs"
                      >
                        <option value="">(seed: {p.stockStatus})</option>
                        {STOCK_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs text-steel underline hover:text-primary">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
