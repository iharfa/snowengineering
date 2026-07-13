import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { dashboardCounts, dbAvailable, revealStats } from "@/lib/db";
import { formatMVR } from "@/lib/utils";

// Live business data + cookie auth — never prerender.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  if (!(await dbAvailable())) {
    return (
      <div className="tech-card p-8">
        <p className="text-sm" style={{ color: "#ba1a1a" }}>
          The local database is unavailable on this host. Orders and leads are
          only reaching ERPNext / email. Check the server logs.
        </p>
      </div>
    );
  }

  const counts = (await dashboardCounts())!;
  const stats = (await revealStats(30)).slice(0, 8);

  const tiles = [
    { label: "Open orders", value: String(counts.ordersOpen), href: "/admin/orders" },
    { label: "Pipeline value", value: formatMVR(counts.pipelineValue), href: "/admin/orders" },
    { label: "New leads", value: String(counts.leadsNew), href: "/admin/leads" },
    { label: "Price reveals (30d)", value: String(counts.reveals30d), href: "/admin/products" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="tech-card block p-5 hover:border-primary">
            <div className="label-mono">{t.label}</div>
            <div className="mt-2 font-heading text-2xl font-bold text-charcoal">
              {t.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="tech-card p-6">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Most-revealed products (last 30 days)
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Demand signal: how often visitors clicked “reveal price”.
        </p>
        {stats.length === 0 ? (
          <p className="mt-4 text-sm text-steel">No price reveals recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="label-mono border-b border-light-grey">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Item code</th>
                  <th className="py-2 pr-4">Reveals</th>
                  <th className="py-2">Unique sessions</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.item_code} className="border-b border-light-grey/60">
                    <td className="py-2 pr-4 text-charcoal">{s.product_name}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{s.item_code}</td>
                    <td className="py-2 pr-4">{s.reveals}</td>
                    <td className="py-2">{s.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="label-mono normal-case tracking-normal text-steel">
        {counts.ordersTotal} order(s) and {counts.leadsTotal} lead(s) on record.
        Database file: data/snow.db (back it up regularly).
      </p>
    </div>
  );
}
