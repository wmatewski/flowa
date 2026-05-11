"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSignIn, useSignUp } from "@clerk/nextjs";

import type { FlashMessage } from "@/lib/types";

interface AuthFormsProps {
  mode: "login" | "register";
  initialFlash: FlashMessage | null;
}

export const AuthForms = ({ mode, initialFlash }: AuthFormsProps) => {
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
          "Konto wymaga dodatkowej weryfikacji w Clerk. Włącz tryb bez weryfikacji e-mail lub dodaj własny ekran potwierdzenia.",
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
        <form className="wf-form-stack" onSubmit={handleLogin}>
          <label className="wf-field">
            <span className="wf-field-label">E-mail</span>
            <input className="wf-input" name="email" placeholder="adres@email.com" type="email" />
          </label>
          <label className="wf-field">
            <span className="wf-field-label">Hasło</span>
            <input className="wf-input" name="password" placeholder="••••••••" type="password" />
          </label>
          <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>
      ) : (
        <form className="wf-form-stack" onSubmit={handleRegister}>
          <label className="wf-field">
            <span className="wf-field-label">Nazwa Organizacji</span>
            <input className="wf-input" name="organizationName" placeholder="Wprowadź nazwę" type="text" />
          </label>
          <label className="wf-field">
            <span className="wf-field-label">E-mail</span>
            <input className="wf-input" name="email" placeholder="adres@email.com" type="email" />
          </label>
          <label className="wf-field">
            <span className="wf-field-label">Hasło</span>
            <input className="wf-input" name="password" placeholder="••••••••" type="password" />
          </label>
          <label className="wf-field">
            <span className="wf-field-label">Potwierdź Hasło</span>
            <input className="wf-input" name="confirmPassword" placeholder="••••••••" type="password" />
          </label>
          <button className="wf-btn wf-btn-primary wf-btn-block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Tworzenie konta..." : "Utwórz konto"}
          </button>
        </form>
      )}
    </>
  );
};
