import { AdminShell } from "@/components/admin/admin-shell";
import { requireOwner } from "@/app/admin/_actions/guard";

// Belt-and-suspenders with robots.txt: never index any admin page.
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate every admin read server-side, not just via middleware. requireOwner
  // redirects to /admin/login unless the signed-in user is the configured owner
  // (and handles the not-configured case), so service-role data never renders
  // without an in-handler authorization check.
  const user = await requireOwner();
  return <AdminShell userEmail={user.email ?? null}>{children}</AdminShell>;
}
