import { redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { AuthForms } from "@/components/auth/auth-forms";
import { getAuthenticatedUser, getEmailVerificationStatus } from "@/lib/admin-auth";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.error === "missing-credentials") {
    return { type: "error", message: "Podaj adres e-mail, aby przejść do logowania." };
  }

  if (params.error === "invalid-credentials") {
    return { type: "error", message: "Logowanie nie powiodło się. Sprawdź dane konta." };
  }

  if (params.error === "missing-registration-fields") {
    return { type: "error", message: "Uzupełnij imię, nazwisko, e-mail i oba pola hasła." };
  }

  if (params.error === "weak-password") {
    return { type: "error", message: "Hasło musi mieć co najmniej 8 znaków." };
  }

  if (params.error === "password-mismatch") {
    return { type: "error", message: "Hasła nie są identyczne." };
  }

  if (params.error === "registration-failed") {
    return { type: "error", message: "Nie udało się utworzyć konta organizatora." };
  }

  if (params.error === "email-verification-expired") {
    return {
      type: "error",
      message: "Minęło 14 dni od utworzenia konta. Zweryfikuj adres e-mail, aby nadal korzystać z panelu.",
    };
  }

  if (params.error === "not-authorized") {
    return {
      type: "error",
      message: "To konto nie ma jeszcze aktywnego członkostwa w organizacji Flowa.",
    };
  }

  if (params.error === "oauth-failed") {
    return {
      type: "error",
      message: "Logowanie przez Google nie powiodło się. Spróbuj ponownie albo użyj adresu e-mail i hasła.",
    };
  }

  if (params.registered === "1") {
    return {
      type: "info",
      message: "Konto zostało utworzone. Sprawdź skrzynkę, wysłaliśmy link do weryfikacji adresu e-mail.",
    };
  }

  if (params.oauth === "google") {
    return {
      type: "info",
      message: "Logowanie przez Google zakończyło się powodzeniem. Dokończ konfigurację organizacji, aby wejść do panelu.",
    };
  }

  return null;
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const mode = params.mode === "register" ? "register" : "login";
  const flash = getFlashMessage(params);
  const { userId, orgId } = await auth();
  let verificationStatus: ReturnType<typeof getEmailVerificationStatus> = null;
  let signedInEmail: string | null = null;

  if (userId) {
    const user = await getAuthenticatedUser();
    verificationStatus = getEmailVerificationStatus(user);
    signedInEmail = user.email;

    if (orgId) {
      redirect("/admin");
    }
  }

  const requiresOrganizationSetup = Boolean(userId) && !orgId;

  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        <section className="wf-auth-card">
          {verificationStatus && signedInEmail ? (
            <EmailVerificationBanner
              daysRemaining={verificationStatus.daysRemaining}
              email={signedInEmail}
              expired={verificationStatus.isExpired}
            />
          ) : null}

          <AuthForms initialFlash={flash} mode={mode} requiresOrganizationSetup={requiresOrganizationSetup} />
        </section>
      </section>
    </main>
  );
}