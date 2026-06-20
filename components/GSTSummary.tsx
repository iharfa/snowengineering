import { formatMVR } from "@/lib/utils";

export function GSTSummary({
  subtotal,
  gstAmount,
  total,
  currency = "MVR",
  pendingReveal = 0,
}: {
  subtotal: number;
  gstAmount: number;
  total: number;
  currency?: string;
  pendingReveal?: number;
}) {
  return (
    <div className="space-y-2 text-sm">
      <Row label="Subtotal" value={formatMVR(subtotal, currency)} />
      <Row label="Estimated GST" value={formatMVR(gstAmount, currency)} />
      <div className="border-t border-light-grey pt-2">
        <Row
          label="Estimated total"
          value={formatMVR(total, currency)}
          strong
        />
      </div>
      {pendingReveal > 0 && (
        <p className="label-mono normal-case tracking-normal text-steel">
          {pendingReveal} item(s) have hidden prices not yet included. Reveal
          them above for a complete estimate.
        </p>
      )}
      <p className="label-mono normal-case tracking-normal text-steel">
        Estimated GST. Final invoice will be issued after confirmation.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold text-charcoal" : "text-on-surface-variant"}>
        {label}
      </span>
      <span
        className={
          strong
            ? "font-heading text-lg font-bold text-charcoal"
            : "font-mono text-charcoal"
        }
      >
        {value}
      </span>
    </div>
  );
}
