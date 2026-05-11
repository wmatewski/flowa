import { redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";
import { AuthForms } from "@/components/auth/auth-forms";
import { activatePendingMemberships, getAuthenticatedUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.error === "missing-credentials") {
    return { type: "error", message: "Podaj adres e-mail i hasło, aby się zalogować." };
  }

  if (params.error === "invalid-credentials") {
    return { type: "error", message: "Logowanie nie powiodło się. Sprawdź dane konta." };
  }

  if (params.error === "missing-registration-fields") {
    return { type: "error", message: "Uzupełnij nazwę organizacji, e-mail i oba pola hasła." };
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
      message: "Konto zostało utworzone. Jeśli wymagane jest potwierdzenie e-mail, dokończ je i wróć do logowania.",
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
  const { userId } = await auth();
  let activeMembershipCount = 0;

  if (userId) {
    const user = await getAuthenticatedUser();
    await activatePendingMemberships(user);

    const adminClient = createSupabaseAdminClient();
    const { count } = await adminClient
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    activeMembershipCount = count ?? 0;

    if (activeMembershipCount > 0) {
      redirect("/admin");
    }
  }

  const requiresOrganizationSetup = Boolean(userId) && activeMembershipCount === 0;

  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        <section className="wf-auth-card">
          <AuthForms initialFlash={flash} mode={mode} requiresOrganizationSetup={requiresOrganizationSetup} />
        </section>
      </section>
    </main>
  );
}