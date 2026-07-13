import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getInvoice, INVOICE_STATUSES } from "@/lib/db";
import { setInvoiceStatusAction } from "@/app/admin/actions";
import { PrintButton } from "@/app/admin/invoices/[id]/PrintButton";
import { formatMVR } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

export const dynamic = "force-dynamic";

// Business identity on printed invoices. SNOW_TIN switches the document title
// to TAX INVOICE (required wording once GST-registered with MIRA).
const TIN = process.env.SNOW_TIN;
const BUSINESS_ADDRESS = process.env.SNOW_ADDRESS || "Malé City, Maldives";
const BUSINESS_EMAIL = process.env.SNOW_ORDER_EMAIL || "sales@snowengineering.mv";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const invoice = await getInvoice(Number(id));
  if (!invoice) notFound();

  let items: CartItem[] = [];
  try {
    items = JSON.parse(invoice.items_json) as CartItem[];
  } catch {
    // tolerate malformed rows
  }

  const docTitle = TIN ? "TAX INVOICE" : "INVOICE";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/invoices"
          className="text-xs text-steel underline hover:text-primary"
        >
          ← Invoices
        </Link>
        <div className="flex items-center gap-3">
          <form action={setInvoiceStatusAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={invoice.id} />
            <select
              name="status"
              defaultValue={invoice.status}
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
          <PrintButton />
        </div>
      </div>

      {invoice.status === "Draft" && (
        <p className="text-sm text-steel print:hidden">
          Draft — set status to <strong>Issued</strong> before sending to the
          customer; that stamps the tax point used in the GST report.
        </p>
      )}

      {/* Printable document */}
      <div className="tech-card mx-auto max-w-3xl bg-white p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between gap-6 border-b border-light-grey pb-6">
          <div>
            <div className="font-heading text-xl font-bold text-charcoal">
              Snow Engineering
            </div>
            <div className="mt-1 text-sm text-on-surface-variant">
              {BUSINESS_ADDRESS}
              <br />
              {BUSINESS_EMAIL}
            </div>
            {TIN && (
              <div className="mt-1 font-mono text-xs text-steel">TIN: {TIN}</div>
            )}
          </div>
          <div className="text-right">
            <div className="label-mono">{docTitle}</div>
            <div className="mt-1 font-mono text-lg font-bold text-charcoal">
              {invoice.invoice_no}
            </div>
            <div className="mt-1 font-mono text-xs text-steel">
              Date: {(invoice.issued_at ?? invoice.created_at).slice(0, 10)}
              <br />
              Status: {invoice.status}
              {invoice.order_id != null && (
                <>
                  <br />
                  Order ref: WEB-{invoice.order_id}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="label-mono">Billed to</div>
            <div className="mt-1 text-sm text-charcoal">
              {invoice.customer_name}
              {invoice.company && (
                <>
                  <br />
                  {invoice.company}
                </>
              )}
              {invoice.location && (
                <>
                  <br />
                  {invoice.location}
                </>
              )}
            </div>
            <div className="mt-1 font-mono text-xs text-steel">
              {[invoice.phone, invoice.email].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="label-mono border-b border-charcoal">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4 text-right">Qty</th>
              <th className="py-2 pr-4 text-right">Unit price</th>
              <th className="py-2 pr-4 text-right">GST %</th>
              <th className="py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-b border-light-grey/60">
                <td className="py-2 pr-4">
                  <span className="text-charcoal">{i.name}</span>
                  <span className="ml-2 font-mono text-xs text-steel">
                    {i.erpnextItemCode}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right font-mono">{i.quantity}</td>
                <td className="py-2 pr-4 text-right font-mono">
                  {i.price != null ? formatMVR(i.price, i.currency) : "—"}
                </td>
                <td className="py-2 pr-4 text-right font-mono">{i.gstRate}%</td>
                <td className="py-2 text-right font-mono">
                  {i.price != null
                    ? formatMVR(i.price * i.quantity, i.currency)
                    : "on confirmation"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="font-mono">{formatMVR(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">GST</span>
            <span className="font-mono">{formatMVR(invoice.gst_amount, invoice.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-charcoal pt-1 font-semibold text-charcoal">
            <span>Total</span>
            <span className="font-mono">{formatMVR(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes && (
          <p className="mt-6 text-xs text-on-surface-variant">
            Notes: {invoice.notes}
          </p>
        )}
        <p className="mt-6 border-t border-light-grey pt-4 text-xs text-steel">
          {TIN
            ? "GST charged at the rates shown per line item."
            : "This document is a commercial invoice. Configure SNOW_TIN to issue MIRA-compliant tax invoices."}{" "}
          Payment terms and delivery as agreed. Thank you for your business.
        </p>
      </div>
    </div>
  );
}
