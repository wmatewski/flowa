import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ClerkAuthForms } from "@/components/auth/clerk-auth-forms";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { getAuthenticatedUser, getEmailVerificationStatus } from "@/lib/admin-auth";
import { sanitizeInternalRedirectUrl } from "@/lib/redirect-url";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId, orgId } = await auth();
  const query = await searchParams;
  const redirectUrl = sanitizeInternalRedirectUrl(
    typeof query.redirect_url === "string" ? query.redirect_url : null,
    "/admin",
  );

  let verificationStatus: ReturnType<typeof getEmailVerificationStatus> = null;
  let signedInEmail: string | null = null;

  if (userId) {
    if (orgId) {
      redirect(redirectUrl);
    }

    const user = await getAuthenticatedUser();
    verificationStatus = getEmailVerificationStatus(user);
    signedInEmail = user.email;
  }

  const requiresOrganizationSetup = Boolean(userId) && !orgId;

  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        {verificationStatus && signedInEmail ? (
          <EmailVerificationBanner
            daysRemaining={verificationStatus.daysRemaining}
            email={signedInEmail}
            expired={verificationStatus.isExpired}
          />
        ) : null}

        <Suspense>
          <ClerkAuthForms redirectUrl={redirectUrl} requiresOrganizationSetup={requiresOrganizationSetup} />
        </Suspense>
      </section>
    </main>
  );
}
