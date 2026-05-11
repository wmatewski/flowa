import { Building2, Info, LockKeyhole, Radio, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";
import { AuthForms } from "@/components/auth/auth-forms";
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
    const adminClient = createSupabaseAdminClient();
    const { count } = await adminClient
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");

    activeMembershipCount = count ?? 0;

    if (activeMembershipCount > 0) {
      redirect("/admin");
    }
  }

  const requiresOrganizationSetup = Boolean(userId) && activeMembershipCount === 0;

  return (
    <>
      <main className="wf-auth-layout">
        <section className="wf-auth-visual-panel">
          <div className="wf-brand">
            <div className="wf-brand-mark">
              <Building2 size={18} />
            </div>
            <span>Wojticore Flowa</span>
          </div>

          <div className="wf-auth-visual-copy">
            <div className="wf-badge">Panel organizatora</div>
            <h1>Precyzja w każdym badaniu.</h1>
            <p>
              Zaloguj się do jednolitego dashboardu, w którym zarządzasz ankietami,
              współtwórcami i widokiem wyników na żywo.
            </p>

            <div className="wf-auth-visual-points">
              <div className="wf-auth-visual-point">
                <ShieldCheck size={18} />
                <span>Bezpieczny dostęp do ankiet i danych organizacji.</span>
              </div>
              <div className="wf-auth-visual-point">
                <Radio size={18} />
                <span>Widok live i embed do prezentacji bez dodatkowych narzędzi.</span>
              </div>
              <div className="wf-auth-visual-point">
                <LockKeyhole size={18} />
                <span>Jedna przestrzeń robocza dla organizacji i przypisanych sesji.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="wf-auth-panel">
          <section className="wf-auth-card">
            <div className="wf-auth-header">
              <div className="wf-auth-subtitle">
                {requiresOrganizationSetup ? "Konfiguracja konta" : "Panel Organizatora"}
              </div>
              <h1>
                {requiresOrganizationSetup
                  ? "Dokończ konfigurację"
                  : mode === "register"
                    ? "Utwórz konto"
                    : "Witaj ponownie"}
              </h1>
              <p className="wf-page-subtitle" style={{ marginTop: 0 }}>
                {requiresOrganizationSetup
                  ? "Jesteś już zalogowany(a). Podaj nazwę organizacji, a przygotujemy Twój panel organizatora."
                  : mode === "register"
                    ? "Załóż konto i uruchom pierwszą ankietę w kilka minut."
                    : "Zaloguj się do panelu sterowania, aby kontynuować pracę."}
              </p>
            </div>

            <AuthForms
              initialFlash={flash}
              mode={mode}
              requiresOrganizationSetup={requiresOrganizationSetup}
            />

            <div className="wf-auth-helper">
              <Info size={18} />
              <p>
                Bierzesz udział w sesji? Nie potrzebujesz konta. Otwórz link udostępniony przez organizatora i przejdź przez 4-etapową ankietę.
              </p>
            </div>

            <div className="wf-footer-muted">
              Szukasz instrukcji dla uczestników? <Link href="/guides">Zobacz poradniki</Link>.
            </div>
          </section>
        </section>
      </main>
    </>
  );
}