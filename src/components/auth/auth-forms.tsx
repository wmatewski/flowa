"use client";

import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSignIn, useSignUp } from "@clerk/nextjs";

import { LogoutButton } from "@/components/auth/logout-button";
import type { FlashMessage } from "@/lib/types";

interface AuthFormsProps {
  mode: "login" | "register";
  initialFlash: FlashMessage | null;
  requiresOrganizationSetup: boolean;
}

export const AuthForms = ({ mode, initialFlash, requiresOrganizationSetup }: AuthFormsProps) => {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const [flash, setFlash] = useState<FlashMessage | null>(initialFlash);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setError = (message: string) => {
    setFlash({
      type: "error",
      message,
    });
    setIsSubmitting(false);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signInLoaded || !signIn || !setSignInActive) {
      setError("Logowanie chwilowo niedostępne. Spróbuj ponownie za moment.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Podaj adres e-mail i hasło, aby się zalogować.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const attempt = await signIn.create({
        identifier: email,
        password,
      });

      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        setError("Logowanie wymaga dodatkowej weryfikacji. Skontaktuj się z administratorem.");
        return;
      }

      await setSignInActive({ session: attempt.createdSessionId });
      await fetch("/api/auth/bootstrap", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Logowanie nie powiodło się. Sprawdź dane konta.");
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signUpLoaded || !signUp || !setSignUpActive) {
      setError("Rejestracja chwilowo niedostępna. Spróbuj ponownie za moment.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const organizationName = String(formData.get("organizationName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!organizationName || !email || !password || !confirmPassword) {
      setError("Uzupełnij nazwę organizacji, e-mail i oba pola hasła.");
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const attempt = await signUp.create({
        emailAddress: email,
        password,
      });

      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        setError(
          "Konto wymaga dodatkowego potwierdzenia adresu e-mail. Dokończ weryfikację i wróć tutaj.",
        );
        return;
      }

      await setSignUpActive({ session: attempt.createdSessionId });

      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ organizationName }),
      });

      if (!response.ok) {
        setError("Konto utworzone, ale nie udało się skonfigurować organizacji.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Nie udało się utworzyć konta organizatora.");
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setFlash(null);

    try {
      if (mode === "register") {
        if (!signUpLoaded || !signUp) {
          setError("Rejestracja przez Google chwilowo niedostępna. Spróbuj ponownie za moment.");
          return;
        }

        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/auth/callback",
          redirectUrlComplete: "/auth/complete?provider=google",
        });

        return;
      }

      if (!signInLoaded || !signIn) {
        setError("Logowanie przez Google chwilowo niedostępne. Spróbuj ponownie za moment.");
        return;
      }

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/callback",
        redirectUrlComplete: "/auth/complete?provider=google",
      });
    } catch {
      setError("Nie udało się uruchomić logowania przez Google.");
    }
  };

  const handleOrganizationSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const organizationName = String(formData.get("organizationName") ?? "").trim();

    if (!organizationName) {
      setError("Podaj nazwę organizacji, aby dokończyć konfigurację konta.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ organizationName }),
      });

      if (!response.ok) {
        setError("Nie udało się utworzyć organizacji. Spróbuj ponownie za chwilę.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Nie udało się utworzyć organizacji. Spróbuj ponownie za chwilę.");
    }
  };

  if (requiresOrganizationSetup) {
    return (
      <>
        {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

        <form className="wf-form-stack wf-auth-form" onSubmit={handleOrganizationSetup}>
          <label className="wf-field">
            <span className="wf-field-label">Nazwa Organizacji</span>
            <span className="wf-input-shell">
              <Building2 className="wf-input-icon" size={18} />
              <input
                className="wf-input wf-input-with-icon"
                name="organizationName"
                placeholder="np. Wojticore Health"
                type="text"
              />
            </span>
          </label>

          <div className="wf-auth-setup-note">
            To konto jest już zalogowane. Ten krok przygotuje organizację i pierwszy dostęp do dashboardu.
          </div>

          <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Przygotowywanie panelu..." : "Dokończ konfigurację"}
            <ArrowRight size={18} />
          </button>

          <LogoutButton />
        </form>
      </>
    );
  }

  return (
    <>
      <div className="wf-tab-row">
        <Link className={`wf-tab-link${mode === "login" ? " is-active" : ""}`} href="/auth?mode=login">
          Logowanie
        </Link>
        <Link className={`wf-tab-link${mode === "register" ? " is-active" : ""}`} href="/auth?mode=register">
          Rejestracja
        </Link>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      {mode === "login" ? (
        <form className="wf-form-stack wf-auth-form" onSubmit={handleLogin}>
          <button className="wf-auth-social-button" disabled={isSubmitting} onClick={handleGoogleAuth} type="button">
            <span className="wf-google-mark">G</span>
            Kontynuuj przez Google
          </button>

          <div className="wf-auth-separator">
            <span>lub użyj adresu e-mail</span>
          </div>

          <label className="wf-field">
            <span className="wf-field-label">E-mail</span>
            <span className="wf-input-shell">
              <Mail className="wf-input-icon" size={18} />
              <input className="wf-input wf-input-with-icon" name="email" placeholder="adres@email.com" type="email" />
            </span>
          </label>
          <label className="wf-field">
            <span className="wf-field-label">Hasło</span>
            <span className="wf-input-shell">
              <Lock className="wf-input-icon" size={18} />
              <input className="wf-input wf-input-with-icon" name="password" placeholder="••••••••" type="password" />
            </span>
          </label>
          <div className="wf-auth-form-meta">
            <span className="wf-footer-muted">Bezpieczne logowanie</span>
            <Link className="wf-link-button" href="/password-reset">
              Nie pamiętasz hasła?
            </Link>
          </div>
          <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <form className="wf-form-stack wf-auth-form" onSubmit={handleRegister}>
          <button className="wf-auth-social-button" disabled={isSubmitting} onClick={handleGoogleAuth} type="button">
            <span className="wf-google-mark">G</span>
            Utwórz konto przez Google
          </button>

          <div className="wf-auth-separator">
            <span>lub utwórz konto przez e-mail</span>
          </div>

          <label className="wf-field">
            <span className="wf-field-label">Nazwa Organizacji</span>
            <span className="wf-input-shell">
              <Building2 className="wf-input-icon" size={18} />
              <input className="wf-input wf-input-with-icon" name="organizationName" placeholder="Wprowadź nazwę" type="text" />
            </span>
          </label>
          <label className="wf-field">
            <span className="wf-field-label">E-mail</span>
            <span className="wf-input-shell">
              <Mail className="wf-input-icon" size={18} />
              <input className="wf-input wf-input-with-icon" name="email" placeholder="adres@email.com" type="email" />
            </span>
          </label>
          <label className="wf-field">
            <span className="wf-field-label">Hasło</span>
            <span className="wf-input-shell">
              <Lock className="wf-input-icon" size={18} />
              <input className="wf-input wf-input-with-icon" name="password" placeholder="••••••••" type="password" />
            </span>
          </label>
          <label className="wf-field">
            <span className="wf-field-label">Potwierdź Hasło</span>
            <span className="wf-input-shell">
              <Lock className="wf-input-icon" size={18} />
              <input className="wf-input wf-input-with-icon" name="confirmPassword" placeholder="••••••••" type="password" />
            </span>
          </label>
          <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Tworzenie konta..." : "Utwórz konto"}
            <ArrowRight size={18} />
          </button>
        </form>
      )}
    </>
  );
};
