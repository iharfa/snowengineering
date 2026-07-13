import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { listLeads, LEAD_STATUSES } from "@/lib/db";
import { setLeadStatusAction } from "@/app/admin/actions";

// Live business data + cookie auth — never prerender.
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const leads = await listLeads();

  return (
    <div className="tech-card p-6">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        Contact leads
      </h2>
      {leads.length === 0 ? (
        <p className="mt-4 text-sm text-steel">No leads yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="label-mono border-b border-light-grey">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Message</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-light-grey/60 align-top">
                  <td className="py-2 pr-4 font-mono text-xs">{l.id}</td>
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs">
                    {l.created_at.slice(0, 16)}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="text-charcoal">
                      {l.name}
                      {l.company ? ` (${l.company})` : ""}
                    </div>
                    <div className="font-mono text-xs text-steel">
                      {l.phone} · {l.email}
                    </div>
                  </td>
                  <td className="max-w-md py-2 pr-4 text-xs text-on-surface-variant">
                    {l.message}
                  </td>
                  <td className="py-2">
                    <form action={setLeadStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={l.id} />
                      <select
                        name="status"
                        defaultValue={l.status}
                        className="h-8 rounded border border-light-grey bg-background px-2 text-xs"
                      >
                        {LEAD_STATUSES.map((s) => (
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
