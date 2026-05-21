import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ClerkAuthForms } from "@/components/auth/clerk-auth-forms";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { getAuthenticatedUser, getEmailVerificationStatus } from "@/lib/admin-auth";
import { sanitizeInternalRedirectUrl } from "@/lib/redirect-url";

type AuthMode = "login" | "register";
type AuthPath = "/login" | "/sign-up";

interface ClerkAuthPageProps {
  mode: AuthMode;
  path: AuthPath;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function ClerkAuthPage({ mode, path, searchParams }: ClerkAuthPageProps) {
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

        <ClerkAuthForms
          key={mode}
          mode={mode}
          path={path}
          redirectUrl={redirectUrl}
          requiresOrganizationSetup={requiresOrganizationSetup}
        />
      </section>
    </main>
  );
}
