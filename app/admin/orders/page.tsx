import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders, ORDER_STATUSES } from "@/lib/db";
import {
  createInvoiceFromOrderAction,
  setOrderStatusAction,
} from "@/app/admin/actions";
import { formatMVR } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

// Live business data + cookie auth — never prerender.
export const dynamic = "force-dynamic";

function itemsSummary(itemsJson: string): string {
  try {
    const items = JSON.parse(itemsJson) as CartItem[];
    return items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
  } catch {
    return "—";
  }
}

export default async function AdminOrdersPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const orders = await listOrders();

  return (
    <div className="tech-card p-6">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        Order inquiries
      </h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-steel">No orders yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="label-mono border-b border-light-grey">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Items</th>
                <th className="py-2 pr-4">Est. total</th>
                <th className="py-2 pr-4">Via</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-light-grey/60 align-top">
                  <td className="py-2 pr-4 font-mono text-xs">{o.id}</td>
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs">
                    {o.created_at.slice(0, 16)}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="text-charcoal">{o.customer_name}</div>
                    <div className="font-mono text-xs text-steel">
                      {o.phone} · {o.location}
                    </div>
                    <div className="font-mono text-xs text-steel">{o.email}</div>
                    {o.order_notes && (
                      <div className="mt-1 max-w-xs text-xs text-on-surface-variant">
                        “{o.order_notes}”
                      </div>
                    )}
                  </td>
                  <td className="max-w-sm py-2 pr-4 text-xs">
                    {itemsSummary(o.items_json)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap font-mono">
                    {formatMVR(o.total)}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="label-mono">{o.via}</span>
                  </td>
                  <td className="py-2">
                    <form action={setOrderStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={o.id} />
                      <select
                        name="status"
                        defaultValue={o.status}
                        className="h-8 rounded border border-light-grey bg-background px-2 text-xs"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs text-steel underline hover:text-primary">
                        Save
                      </button>
                    </form>
                    <form action={createInvoiceFromOrderAction} className="mt-1.5">
                      <input type="hidden" name="order_id" value={o.id} />
                      <button className="text-xs text-steel underline hover:text-primary">
                        Create invoice
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
