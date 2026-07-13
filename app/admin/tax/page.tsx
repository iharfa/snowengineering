import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { gstSummaryByMonth } from "@/lib/db";
import { formatMVR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTaxPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const months = await gstSummaryByMonth();

  return (
    <div className="tech-card p-6">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        GST report
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        GST collected per month across <strong>Issued</strong> and{" "}
        <strong>Paid</strong> invoices, grouped by issue date (tax point). Use
        these figures to prepare your MIRA GST return — the return you file
        with MIRA remains the official record.
      </p>
      {months.length === 0 ? (
        <p className="mt-4 text-sm text-steel">
          No issued invoices yet. Issue an invoice and it will appear here.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="label-mono border-b border-light-grey">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">Invoices</th>
                <th className="py-2 pr-4">Taxable sales</th>
                <th className="py-2 pr-4">GST collected</th>
                <th className="py-2">Total incl. GST</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-light-grey/60">
                  <td className="py-2 pr-4 font-mono">{m.month}</td>
                  <td className="py-2 pr-4">{m.invoices}</td>
                  <td className="py-2 pr-4 font-mono">{formatMVR(m.taxable_sales)}</td>
                  <td className="py-2 pr-4 font-mono font-semibold text-charcoal">
                    {formatMVR(m.gst)}
                  </td>
                  <td className="py-2 font-mono">{formatMVR(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
