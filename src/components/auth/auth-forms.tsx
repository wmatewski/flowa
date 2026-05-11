"use client";

import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

import { useSignIn, useSignUp } from "@clerk/nextjs";

import { LogoutButton } from "@/components/auth/logout-button";
import type { FlashMessage } from "@/lib/types";

type AuthMode = "login" | "register";
interface AuthFormsProps {
  mode: AuthMode;
  initialFlash: FlashMessage | null;
  requiresOrganizationSetup: boolean;
}

type PendingVerification =
  | {
      flow: "sign-up";
      email: string;
      organizationName: string;
    }
  | {
      flow: "sign-in";
      email: string;
      emailAddressId: string;
    };

interface VerificationCodeInputProps {
  disabled: boolean;
  idPrefix: string;
  onCodeChange?: () => void;
  onComplete: (code: string) => Promise<void> | void;
}

interface EmailCodeFactor {
  strategy: "email_code";
  emailAddressId: string;
  safeIdentifier: string;
}

const OTP_LENGTH = 6;

const getClerkErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error == null || !("errors" in error)) {
    return fallback;
  }

  const errors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
  const message = errors?.[0]?.longMessage ?? errors?.[0]?.message;

  return message ? String(message) : fallback;
};

const getEmailCodeFactor = (factors: unknown[] | null | undefined): EmailCodeFactor | null => {
  const factor = factors?.find((candidate) => {
    if (typeof candidate !== "object" || candidate == null || !("strategy" in candidate)) {
      return false;
    }

    return candidate.strategy === "email_code";
  });

  if (!factor || typeof factor !== "object") {
    return null;
  }

  return factor as EmailCodeFactor;
};

const VerificationCodeInput = ({ disabled, idPrefix, onCodeChange, onComplete }: VerificationCodeInputProps) => {
  const [digits, setDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (disabled) {
      return;
    }

    inputRefs.current[0]?.focus();
  }, [disabled]);

  useEffect(() => {
    const code = digits.join("");

    if (disabled || digits.some((digit) => !digit) || code.length !== OTP_LENGTH) {
      return;
    }

    if (lastSubmittedCodeRef.current === code) {
      return;
    }

    lastSubmittedCodeRef.current = code;
    void onComplete(code);
  }, [digits, disabled, onComplete]);

  const updateDigits = (nextDigits: string[]) => {
    lastSubmittedCodeRef.current = null;
    setDigits(nextDigits);
    onCodeChange?.();
  };

  const applyChunk = (startIndex: number, rawValue: string) => {
    const chunk = rawValue.replace(/\D/g, "").slice(0, OTP_LENGTH - startIndex);

    if (!chunk) {
      const nextDigits = [...digits];
      nextDigits[startIndex] = "";
      updateDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];

    for (const [offset, character] of chunk.split("").entries()) {
      nextDigits[startIndex + offset] = character;
    }

    updateDigits(nextDigits);

    const nextFocusIndex = Math.min(startIndex + chunk.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    applyChunk(index, value);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      const nextDigits = [...digits];

      if (nextDigits[index]) {
        nextDigits[index] = "";
        updateDigits(nextDigits);
        return;
      }

      if (index === 0) {
        return;
      }

      nextDigits[index - 1] = "";
      updateDigits(nextDigits);
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    applyChunk(index, event.clipboardData.getData("text"));
  };

  return (
    <div className="wf-auth-code-shell">
      <div className="wf-auth-code-row" role="group" aria-label="Kod weryfikacyjny">
        {digits.map((digit, index) => (
          <input
            aria-label={`Cyfra ${index + 1} kodu`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className="wf-input wf-auth-code-slot"
            disabled={disabled}
            id={`${idPrefix}-${index}`}
            inputMode="numeric"
            key={`${idPrefix}-${index}`}
            maxLength={OTP_LENGTH}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            value={digit}
          />
        ))}
      </div>
    </div>
  );
};

export const AuthForms = ({ mode, initialFlash, requiresOrganizationSetup }: AuthFormsProps) => {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const [activeMode, setActiveMode] = useState<AuthMode>(mode);
  const [flash, setFlash] = useState<FlashMessage | null>(initialFlash?.type === "error" ? initialFlash : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);

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

    return response.ok;
  };

  const completeOrganizerSignIn = async (sessionId: string) => {
    await setSignInActive?.({ session: sessionId });
    await fetch("/api/auth/bootstrap", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  const completeOrganizerSignUp = async (sessionId: string, organizationName: string) => {
    await setSignUpActive?.({ session: sessionId });

    const configured = await finishBootstrap(organizationName);

    if (!configured) {
      setError("Nie udało się przygotować organizacji.");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  const prepareLoginCodeVerification = async (factors: unknown[] | null | undefined, fallbackEmail: string) => {
    if (!signIn) {
      return false;
    }

    const emailCodeFactor = getEmailCodeFactor(factors);

    if (!emailCodeFactor) {
      return false;
    }

    await signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: emailCodeFactor.emailAddressId,
    });

    setPendingVerification({
      flow: "sign-in",
      email: emailCodeFactor.safeIdentifier ?? fallbackEmail,
      emailAddressId: emailCodeFactor.emailAddressId,
    });
    setIsSubmitting(false);

    return true;
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
      setError("Logowanie chwilowo niedostępne.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Podaj adres e-mail i hasło.");
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      const initialAttempt = await signIn.create({
        identifier: email,
      });

      const passwordAttempt = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (passwordAttempt.status === "complete" && passwordAttempt.createdSessionId) {
        await completeOrganizerSignIn(passwordAttempt.createdSessionId);
        return;
      }

      const codePrepared = await prepareLoginCodeVerification(
        passwordAttempt.supportedFirstFactors ?? initialAttempt.supportedFirstFactors,
        email,
      );

      if (codePrepared) {
        return;
      }

      setError("Nie udało się dokończyć logowania.");
    } catch (error) {
      setError(getClerkErrorMessage(error, "Logowanie nie powiodło się. Sprawdź dane konta."));
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signUpLoaded || !signUp || !setSignUpActive) {
      setError("Rejestracja chwilowo niedostępna.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const organizationName = String(formData.get("organizationName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!organizationName || !email || !password || !confirmPassword) {
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
        emailAddress: email,
        password,
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await completeOrganizerSignUp(attempt.createdSessionId, organizationName);
        return;
      }

      await attempt.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification({
        flow: "sign-up",
        email,
        organizationName,
      });
      setIsSubmitting(false);
    } catch (error) {
      setError(getClerkErrorMessage(error, "Nie udało się utworzyć konta."));
    }
  };

  const handleVerificationComplete = async (code: string) => {
    if (!pendingVerification) {
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      if (pendingVerification.flow === "sign-up") {
        if (!signUpLoaded || !signUp || !setSignUpActive) {
          setError("Weryfikacja chwilowo niedostępna.");
          return;
        }

        const verificationAttempt = await signUp.attemptEmailAddressVerification({ code });

        if (verificationAttempt.status !== "complete" || !verificationAttempt.createdSessionId) {
          setError("Kod jest nieprawidłowy.");
          return;
        }

        await completeOrganizerSignUp(
          verificationAttempt.createdSessionId,
          pendingVerification.organizationName,
        );
        return;
      }

      if (!signInLoaded || !signIn || !setSignInActive) {
        setError("Weryfikacja chwilowo niedostępna.");
        return;
      }

      const verificationAttempt = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (verificationAttempt.status !== "complete" || !verificationAttempt.createdSessionId) {
        setError("Kod jest nieprawidłowy.");
        return;
      }

      await completeOrganizerSignIn(verificationAttempt.createdSessionId);
    } catch (error) {
      setError(getClerkErrorMessage(error, "Kod jest nieprawidłowy."));
    }
  };

  const handleResendVerificationCode = async () => {
    if (!pendingVerification) {
      return;
    }

    setIsSubmitting(true);
    setFlash(null);

    try {
      if (pendingVerification.flow === "sign-up") {
        if (!signUpLoaded || !signUp) {
          setError("Nie udało się wysłać kodu.");
          return;
        }

        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setIsSubmitting(false);
        return;
      }

      if (!signInLoaded || !signIn) {
        setError("Nie udało się wysłać kodu.");
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: pendingVerification.emailAddressId,
      });
      setIsSubmitting(false);
    } catch (error) {
      setError(getClerkErrorMessage(error, "Nie udało się wysłać kodu."));
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

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Nie udało się utworzyć organizacji.");
    }
  };

  const heading = requiresOrganizationSetup
    ? {
        eyebrow: "Konfiguracja konta",
        title: "Dokończ konfigurację",
        description: "Podaj nazwę organizacji.",
      }
    : pendingVerification
      ? {
          eyebrow:
            pendingVerification.flow === "sign-up" ? "Weryfikacja adresu e-mail" : "Potwierdzenie logowania",
          title: "Wpisz kod",
          description: `Kod został wysłany na ${pendingVerification.email}.`,
        }
      : activeMode === "register"
        ? {
            eyebrow: "Rejestracja",
            title: "Utwórz konto",
            description: "Załóż konto organizatora.",
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

      <div className="wf-auth-stage" key={pendingVerification ? pendingVerification.flow : activeMode}>
        {pendingVerification ? (
          <div className="wf-form-stack wf-auth-form wf-auth-stage-panel">
            <VerificationCodeInput
              disabled={isSubmitting}
              idPrefix={`wf-${pendingVerification.flow}-code`}
              onCodeChange={clearFlash}
              onComplete={handleVerificationComplete}
            />

            <div className="wf-auth-form-meta wf-auth-secondary-row">
              <button className="wf-link-button" disabled={isSubmitting} onClick={handleResendVerificationCode} type="button">
                Wyślij kod ponownie
              </button>
            </div>
          </div>
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
            <div className="wf-auth-form-meta wf-auth-secondary-row">
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
