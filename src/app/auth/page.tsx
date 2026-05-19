import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ClerkAuthForms } from "@/components/auth/clerk-auth-forms";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { getAuthenticatedUser, getEmailVerificationStatus } from "@/lib/admin-auth";

export default async function AuthPage() {
  const { userId, orgId } = await auth();

  let verificationStatus: ReturnType<typeof getEmailVerificationStatus> = null;
  let signedInEmail: string | null = null;

  if (userId) {
    if (orgId) {
      redirect("/admin");
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
          <ClerkAuthForms requiresOrganizationSetup={requiresOrganizationSetup} />
        </Suspense>
      </section>
    </main>
  );
}
