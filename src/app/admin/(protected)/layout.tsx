import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, membership } = await getAuthenticatedAdmin();

  return (
    <AdminShell
      displayName={user.displayName || user.email}
      email={user.email || "organizator"}
      organizationName={organization.name}
      role={membership.role}
    >
      {children}
    </AdminShell>
  );
}