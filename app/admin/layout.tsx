import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { logoutAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Admin | Snow Engineering",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdmin();

  return (
    <div className="container-tech py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-light-grey pb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-bold text-charcoal">
            Snow Engineering — Admin
          </h1>
          <span className="label-mono">internal</span>
        </div>
        {authed && (
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin" className="text-steel hover:text-primary">
              Dashboard
            </Link>
            <Link href="/admin/orders" className="text-steel hover:text-primary">
              Orders
            </Link>
            <Link href="/admin/leads" className="text-steel hover:text-primary">
              Leads
            </Link>
            <Link href="/admin/products" className="text-steel hover:text-primary">
              Products
            </Link>
            <form action={logoutAction}>
              <button className="text-steel underline hover:text-primary">
                Log out
              </button>
            </form>
          </nav>
        )}
      </div>
      {children}
    </div>
  );
}
