"use client";

import { ArrowRight, Building2, Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";

import { LogoutButton } from "@/components/auth/logout-button";
import type { FlashMessage } from "@/lib/types";

type AuthMode = "login" | "register";
type LoginStage = "identifier" | "options";

interface AuthFormsProps {
  mode: AuthMode;
  initialFlash: FlashMessage | null;
  requiresOrganizationSetup: boolean;
}

const getClerkErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error == null || !("errors" in error)) {
    return fallback;
  }

  const errors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
  const message = errors?.[0]?.longMessage ?? errors?.[0]?.message;

  return message ? String(message) : fallback;
};

const getVerifyRedirectUrl = () => {
  if (typeof window === "undefined") {
    return "/auth/verify";
  }

  return new URL("/auth/verify", window.location.origin).toString();
};

export const AuthForms = ({ mode, initialFlash, requiresOrganizationSetup }: AuthFormsProps) => {
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const [activeMode, setActiveMode] = useState<AuthMode>(mode);
  const [flash, setFlash] = useState<FlashMessage | null>(initialFlash);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStage, setLoginStage] = useState<LoginStage>("identifier");
  const [loginEmail, setLoginEmail] = useState("");

  const setError = (message: string) => {
    setFlash({
      type: "error",
      message,
    });
    setIsSubmitting(false);
  };

  const clearFlash = () => {
    if (flash) {
      setFlash(null);
    }
  };

  const finishBootstrap = async (organizationName?: string) => {
    const response = await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(organizationName ? { organizationName } : {}),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as { clerkOrganizationId?: string | null };
  };

  const completeOrganizerSignIn = async (sessionId: string) => {
    await setSignInActive?.({ session: sessionId });
    router.replace("/auth");
    router.refresh();
  };

  const sendSignUpVerificationLink = async () => {
    if (!signUp) {
      return;
    }

    await signUp.prepareEmailAddressVerification({
      strategy: "email_link",
      redirectUrl: getVerifyRedirectUrl(),
    });
  };

  const completeOrganizerSignUp = async (sessionId: string) => {
    await setSignUpActive?.({ session: sessionId });
    await sendSignUpVerificationLink().catch(() => undefined);
    router.push("/auth?registered=1");
    router.refresh();
  };

  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === activeMode) {
      return;
    }

    startTransition(() => {
      setActiveMode(nextMode);
      setLoginStage("identifier");
      setLoginEmail("");
      setFlash(null);
      setIsSubmitting(false);
    });
  };

  const handleLoginIdentifier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setError("Podaj adres e-mail.");
      return;
    }

    clearFlash();
    setLoginEmail(email);
    setLoginStage("options");
  };

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signInLoaded || !signIn || !setSignInActive) {
      setError("Logowanie chwilowo niedostępne.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!loginEmail || !password) {
      setError("Podaj hasło, aby się zalogować.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const passwordAttempt = await signIn.create({
        strategy: "password",
        identifier: loginEmail,
        password,
      });

      if (passwordAttempt.status === "complete" && passwordAttempt.createdSessionId) {
        await completeOrganizerSignIn(passwordAttempt.createdSessionId);
        return;
      }

      setError("Nie udało się dokończyć logowania.");
    } catch (error) {
      setError(getClerkErrorMessage(error, "Logowanie nie powiodło się. Sprawdź dane konta."));
    }
  };

  const handleMagicLinkLogin = async () => {
    if (!signInLoaded || !signIn) {
      setError("Logowanie chwilowo niedostępne.");
      return;
    }

    if (!loginEmail) {
      setError("Podaj adres e-mail.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const attempt = await signIn.create({
        strategy: "email_link",
        identifier: loginEmail,
        redirectUrl: getVerifyRedirectUrl(),
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await completeOrganizerSignIn(attempt.createdSessionId);
        return;
      }

      setFlash({
        type: "info",
        message: `Wysłaliśmy magic link na ${loginEmail}. Otwórz go, aby dokończyć logowanie.`,
      });
      setIsSubmitting(false);
    } catch (error) {
      setError(getClerkErrorMessage(error, "Nie udało się wysłać magic linka."));
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signUpLoaded || !signUp || !setSignUpActive) {
      setError("Rejestracja chwilowo niedostępna.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Uzupełnij wszystkie pola.");
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
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await completeOrganizerSignUp(attempt.createdSessionId);
        return;
      }

      await sendSignUpVerificationLink();
      setFlash({
        type: "info",
        message: `Konto zostało utworzone. Sprawdź skrzynkę ${email}, aby potwierdzić adres e-mail.`,
      });
      setActiveMode("login");
      setIsSubmitting(false);
    } catch (error) {
      setError(getClerkErrorMessage(error, "Nie udało się utworzyć konta."));
    }
  };

  const handleOrganizationSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const organizationName = String(formData.get("organizationName") ?? "").trim();

    if (!organizationName) {
      setError("Podaj nazwę organizacji.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const configured = await finishBootstrap(organizationName);

      if (!configured) {
        setError("Nie udało się utworzyć organizacji.");
        return;
      }

      if (configured.clerkOrganizationId) {
        await clerk.setActive({ organization: configured.clerkOrganizationId });
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Nie udało się utworzyć organizacji.");
    }
  };

  const heading = requiresOrganizationSetup
    ? {
        eyebrow: "Konfiguracja konta",
        title: "Utwórz organizację",
        description: "Na tym etapie podajesz wyłącznie nazwę organizacji w Clerk.",
      }
    : activeMode === "login" && loginStage === "options"
      ? {
          eyebrow: "Logowanie",
          title: "Wybierz metodę logowania",
          description: `Kontynuujesz dla ${loginEmail}. Możesz wpisać hasło albo poprosić o magic link.`,
        }
      : activeMode === "register"
        ? {
            eyebrow: "Rejestracja",
            title: "Utwórz konto",
            description: "Załóż konto organizatora bez podawania nazwy organizacji na starcie.",
          }
        : {
            eyebrow: "Logowanie",
            title: "Witaj ponownie",
            description: "Najpierw podaj adres e-mail, a potem wybierz sposób logowania.",
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

            <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Tworzenie organizacji..." : "Utwórz organizację"}
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

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-auth-stage" key={`${activeMode}-${loginStage}`}>
        {activeMode === "login" && loginStage === "identifier" ? (
          <form className="wf-form-stack wf-auth-form wf-auth-stage-panel" onSubmit={handleLoginIdentifier}>
            <label className="wf-field">
              <span className="wf-field-label">E-mail</span>
              <span className="wf-input-shell">
                <Mail className="wf-input-icon" size={18} />
                <input className="wf-input wf-input-with-icon" name="email" placeholder="adres@email.com" type="email" />
              </span>
            </label>

            <div className="wf-auth-form-meta wf-auth-secondary-row">
              <Link className="wf-link-button" href="/password-reset">
                Nie pamiętasz hasła?
              </Link>
            </div>

            <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
              Dalej
              <ArrowRight size={18} />
            </button>
          </form>
        ) : activeMode === "login" ? (
          <div className="wf-form-stack wf-auth-form wf-auth-stage-panel">
            <form className="wf-form-stack" onSubmit={handlePasswordLogin}>
              <label className="wf-field">
                <span className="wf-field-label">E-mail</span>
                <input className="wf-input" disabled value={loginEmail} />
              </label>

              <label className="wf-field">
                <span className="wf-field-label">Hasło</span>
                <span className="wf-input-shell">
                  <Lock className="wf-input-icon" size={18} />
                  <input className="wf-input wf-input-with-icon" name="password" placeholder="••••••••" type="password" />
                </span>
              </label>

              <div className="wf-auth-form-meta wf-auth-secondary-row">
                <button className="wf-link-button" onClick={() => setLoginStage("identifier")} type="button">
                  Zmień adres e-mail
                </button>
                <Link className="wf-link-button" href="/password-reset">
                  Nie pamiętasz hasła?
                </Link>
              </div>

              <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Logowanie..." : "Zaloguj się hasłem"}
                <ArrowRight size={18} />
              </button>
            </form>

            <button className="wf-btn wf-btn-secondary wf-btn-block" disabled={isSubmitting} onClick={handleMagicLinkLogin} type="button">
              {isSubmitting ? "Wysyłanie..." : "Wyślij magic link"}
            </button>
          </div>
        ) : (
          <form className="wf-form-stack wf-auth-form wf-auth-stage-panel" onSubmit={handleRegister}>
            <label className="wf-field">
              <span className="wf-field-label">Imię</span>
              <span className="wf-input-shell">
                <UserRound className="wf-input-icon" size={18} />
                <input className="wf-input wf-input-with-icon" name="firstName" placeholder="Wprowadź imię" type="text" />
              </span>
            </label>

            <label className="wf-field">
              <span className="wf-field-label">Nazwisko</span>
              <span className="wf-input-shell">
                <UserRound className="wf-input-icon" size={18} />
                <input className="wf-input wf-input-with-icon" name="lastName" placeholder="Wprowadź nazwisko" type="text" />
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

            <p className="wf-page-subtitle" style={{ margin: 0 }}>
              Po utworzeniu konta wyślemy link do weryfikacji e-mail. Nazwę organizacji dodasz dopiero po zalogowaniu.
            </p>
          </form>
        )}
      </div>
    </>
  );
};
