import { Leaf, Info } from "lucide-react";
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

  if (params.registered === "1") {
    return {
      type: "info",
      message: "Konto zostało utworzone. Jeśli wymagane jest potwierdzenie e-mail, dokończ je i wróć do logowania.",
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

  if (userId) {
    const adminClient = createSupabaseAdminClient();
    const { count } = await adminClient
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");

    if ((count ?? 0) > 0) {
      redirect("/admin");
    }
  }

  return (
    <>
      <main className="wf-auth-shell">
        <section className="wf-auth-card">
          <div className="wf-auth-header">
            <div className="wf-brand" style={{ justifyContent: "center", display: "flex" }}>
              <div className="wf-brand-mark">
                <Leaf size={18} />
              </div>
              <span>Wojticore Flowa</span>
            </div>
            <div className="wf-auth-subtitle">Panel Organizatora</div>
          </div>

            <AuthForms initialFlash={flash} mode={mode} />

          <div className="wf-auth-helper">
            <Info size={18} />
            <p>
              Bierzesz udział w sesji? Nie musisz zakładać konta. Wystarczy skorzystać z linku udostępnionego przez organizatora.
            </p>
          </div>
        </section>
      </main>

      <footer className="wf-footer">
        <div className="wf-footer-inner">
          <div className="wf-brand">
            <div className="wf-brand-mark">
              <Leaf size={16} />
            </div>
            <span>Wojticore Flowa</span>
          </div>
          <div>© 2024 Wojticore Flowa. Wszystkie prawa zastrzeżone.</div>
          <nav className="wf-footer-nav">
            <Link href="/guides">Dokumentacja Open-Source</Link>
            <Link href="/">flowa.wojticore.pl</Link>
            <Link href="/guides">Polityka Prywatności</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}