import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { listInvoices, INVOICE_STATUSES } from "@/lib/db";
import { setInvoiceStatusAction } from "@/app/admin/actions";
import { formatMVR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const invoices = await listInvoices();

  return (
    <div className="tech-card p-6">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        Invoices
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Create invoices from the Orders page. Issue an invoice to lock its tax
        point; issued and paid invoices feed the GST report under Tax.
      </p>
      {invoices.length === 0 ? (
        <p className="mt-4 text-sm text-steel">
          No invoices yet — open{" "}
          <Link href="/admin/orders" className="underline">
            Orders
          </Link>{" "}
          and click “Create invoice” on an order.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="label-mono border-b border-light-grey">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-light-grey/60">
                  <td className="py-2 pr-4 font-mono text-xs">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="underline hover:text-primary"
                    >
                      {inv.invoice_no}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs">
                    {(inv.issued_at ?? inv.created_at).slice(0, 10)}
                  </td>
                  <td className="py-2 pr-4">{inv.customer_name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {formatMVR(inv.total, inv.currency)}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="label-mono">{inv.status}</span>
                  </td>
                  <td className="py-2">
                    <form
                      action={setInvoiceStatusAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={inv.id} />
                      <select
                        name="status"
                        defaultValue={inv.status}
                        className="h-8 rounded border border-light-grey bg-background px-2 text-xs"
                      >
                        {INVOICE_STATUSES.map((s) => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
