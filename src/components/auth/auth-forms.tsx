"use client";

import { ArrowRight, Building2, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useSignIn, useSignUp } from "@clerk/nextjs";

import { LogoutButton } from "@/components/auth/logout-button";
import type { FlashMessage } from "@/lib/types";

type AuthMode = "login" | "register";

interface AuthFormsProps {
  mode: AuthMode;
  initialFlash: FlashMessage | null;
  requiresOrganizationSetup: boolean;
}

interface PendingVerification {
  email: string;
  organizationName: string;
}

const getClerkErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error == null || !("errors" in error)) {
    return fallback;
  }

  const errors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
  const message = errors?.[0]?.longMessage ?? errors?.[0]?.message;

  return message ? String(message) : fallback;
};

export const AuthForms = ({ mode, initialFlash, requiresOrganizationSetup }: AuthFormsProps) => {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const [activeMode, setActiveMode] = useState<AuthMode>(mode);
  const [flash, setFlash] = useState<FlashMessage | null>(initialFlash);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);

  const setError = (message: string) => {
    setFlash({
      type: "error",
      message,
    });
    setIsSubmitting(false);
  };

  const setInfo = (message: string) => {
    setFlash({
      type: "info",
      message,
    });
    setIsSubmitting(false);
  };

  const finishBootstrap = async (organizationName?: string) => {
    const response = await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(organizationName ? { organizationName } : {}),
    });

    return response.ok;
  };

  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === activeMode) {
      return;
    }

    startTransition(() => {
      setActiveMode(nextMode);
      setPendingVerification(null);
      setFlash(null);
      setIsSubmitting(false);
    });
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
    } catch (error) {
      setError(getClerkErrorMessage(error, "Logowanie nie powiodło się. Sprawdź dane konta."));
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

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setSignUpActive({ session: attempt.createdSessionId });

        const configured = await finishBootstrap(organizationName);

        if (!configured) {
          setError("Konto utworzone, ale nie udało się skonfigurować organizacji.");
          return;
        }

        router.push("/admin");
        router.refresh();
        return;
      }

      await attempt.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification({ email, organizationName });
      setInfo(`Wysłaliśmy kod weryfikacyjny na ${email}. Wpisz go poniżej, aby aktywować konto.`);
    } catch (error) {
      setError(getClerkErrorMessage(error, "Nie udało się utworzyć konta organizatora."));
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingVerification) {
      setError("Najpierw utwórz konto, aby przejść do weryfikacji adresu e-mail.");
      return;
    }

    if (!signUpLoaded || !signUp || !setSignUpActive) {
      setError("Weryfikacja chwilowo niedostępna. Spróbuj ponownie za moment.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();

    if (!code) {
      setError("Wpisz kod weryfikacyjny z wiadomości e-mail.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const verificationAttempt = await signUp.attemptEmailAddressVerification({ code });

      if (verificationAttempt.status !== "complete" || !verificationAttempt.createdSessionId) {
        setError("Nie udało się potwierdzić adresu e-mail. Sprawdź kod i spróbuj ponownie.");
        return;
      }

      await setSignUpActive({ session: verificationAttempt.createdSessionId });

      const configured = await finishBootstrap(pendingVerification.organizationName);

      if (!configured) {
        setError("Adres e-mail został potwierdzony, ale nie udało się skonfigurować organizacji.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setError(
        getClerkErrorMessage(error, "Nie udało się potwierdzić adresu e-mail. Sprawdź kod i spróbuj ponownie."),
      );
    }
  };

  const handleResendVerificationCode = async () => {
    if (!pendingVerification || !signUpLoaded || !signUp) {
      setError("Najpierw rozpocznij rejestrację, aby wysłać kolejny kod.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setInfo(`Wysłaliśmy nowy kod na ${pendingVerification.email}.`);
    } catch (error) {
      setError(getClerkErrorMessage(error, "Nie udało się wysłać nowego kodu. Spróbuj ponownie."));
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
      const configured = await finishBootstrap(organizationName);

      if (!configured) {
        setError("Nie udało się utworzyć organizacji. Spróbuj ponownie za chwilę.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Nie udało się utworzyć organizacji. Spróbuj ponownie za chwilę.");
    }
  };

  const heading = requiresOrganizationSetup
    ? {
        eyebrow: "Konfiguracja konta",
        title: "Dokończ konfigurację",
        description: "Podaj nazwę organizacji, a przygotujemy Twój panel organizatora.",
      }
    : pendingVerification
      ? {
          eyebrow: "Weryfikacja adresu e-mail",
          title: "Wpisz kod",
          description: `Kod został wysłany na ${pendingVerification.email}.`,
        }
      : activeMode === "register"
        ? {
            eyebrow: "Rejestracja",
            title: "Utwórz konto",
            description: "Załóż konto organizatora i dokończ konfigurację w kilku krokach.",
          }
        : {
            eyebrow: "Logowanie",
            title: "Witaj ponownie",
            description: "Zaloguj się do panelu organizatora.",
          };

  if (requiresOrganizationSetup) {
    return (
      <>
        <div className="wf-auth-header">
          <div className="wf-auth-subtitle">{heading.eyebrow}</div>
          <h1>{heading.title}</h1>
          <p className="wf-page-subtitle" style={{ marginTop: 0 }}>
            {heading.description}
          </p>
        </div>

        {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

        <div className="wf-auth-stage" key="setup">
          <form className="wf-form-stack wf-auth-form wf-auth-stage-panel" onSubmit={handleOrganizationSetup}>
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
        </div>
      </>
    );
  }

  return (
    <>
      <div className="wf-auth-header">
        <div className="wf-auth-subtitle">{heading.eyebrow}</div>
        <h1>{heading.title}</h1>
        <p className="wf-page-subtitle" style={{ marginTop: 0 }}>
          {heading.description}
        </p>
      </div>

      {!pendingVerification ? (
        <div className="wf-tab-row" role="tablist" aria-label="Przełącznik formularzy logowania i rejestracji">
          <button
            aria-selected={activeMode === "login"}
            className={`wf-tab-link${activeMode === "login" ? " is-active" : ""}`}
            onClick={() => handleModeChange("login")}
            role="tab"
            type="button"
          >
            Logowanie
          </button>
          <button
            aria-selected={activeMode === "register"}
            className={`wf-tab-link${activeMode === "register" ? " is-active" : ""}`}
            onClick={() => handleModeChange("register")}
            role="tab"
            type="button"
          >
            Rejestracja
          </button>
        </div>
      ) : null}

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-auth-stage" key={pendingVerification ? "verification" : activeMode}>
        {pendingVerification ? (
          <form className="wf-form-stack wf-auth-form wf-auth-stage-panel" onSubmit={handleVerifyEmail}>
            <div className="wf-auth-verification-note">
              <ShieldCheck size={18} />
              <span>Wpisz kod z wiadomości e-mail, aby aktywować konto i dokończyć konfigurację organizacji.</span>
            </div>

            <label className="wf-field">
              <span className="wf-field-label">Kod weryfikacyjny</span>
              <span className="wf-input-shell">
                <Mail className="wf-input-icon" size={18} />
                <input
                  autoComplete="one-time-code"
                  className="wf-input wf-input-with-icon"
                  inputMode="numeric"
                  name="code"
                  placeholder="Wpisz kod z e-maila"
                  type="text"
                />
              </span>
            </label>

            <div className="wf-auth-form-meta wf-auth-secondary-row">
              <button className="wf-link-button" disabled={isSubmitting} onClick={handleResendVerificationCode} type="button">
                Wyślij kod ponownie
              </button>
            </div>

            <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Potwierdzanie..." : "Potwierdź adres e-mail"}
              <ArrowRight size={18} />
            </button>
          </form>
        ) : activeMode === "login" ? (
          <form className="wf-form-stack wf-auth-form wf-auth-stage-panel" onSubmit={handleLogin}>
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
          <form className="wf-form-stack wf-auth-form wf-auth-stage-panel" onSubmit={handleRegister}>
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
      </div>
    </>
  );
};
