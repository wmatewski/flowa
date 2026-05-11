import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthenticatedAdmin, getEmailVerificationStatus } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, membership } = await getAuthenticatedAdmin();
  const verificationStatus = getEmailVerificationStatus(user);

  return (
    <AdminShell
      displayName={user.displayName || user.email}
      email={user.email || "organizator"}
      organizationName={organization.name}
      role={membership.role}
    >
      {verificationStatus ? (
        <EmailVerificationBanner
          daysRemaining={verificationStatus.daysRemaining}
          email={user.email}
          expired={verificationStatus.isExpired}
        />
      ) : null}

      {children}
    </AdminShell>
  );
}