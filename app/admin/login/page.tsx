import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const ERRORS: Record<string, string> = {
  bad: "Incorrect password.",
  rate: "Too many attempts. Wait a minute and try again.",
  unconfigured: "Admin access is not configured.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;

  if (!adminConfigured()) {
    return (
      <div className="tech-card mx-auto max-w-lg p-8">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Admin not configured
        </h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Set the <code className="font-mono">ADMIN_PASSWORD</code> environment
          variable (in <code className="font-mono">.env.local</code> or your
          hosting dashboard) and restart the server to enable the admin
          backend.
        </p>
      </div>
    );
  }

  return (
    <div className="tech-card mx-auto max-w-sm p-8">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        Admin login
      </h2>
      <form action={loginAction} className="mt-4 space-y-4">
        <div>
          <Label>Password</Label>
          <Input type="password" name="password" autoFocus required />
        </div>
        {error && (
          <p className="text-sm" style={{ color: "#ba1a1a" }}>
            {ERRORS[error] ?? "Login failed."}
          </p>
        )}
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </div>
  );
}
