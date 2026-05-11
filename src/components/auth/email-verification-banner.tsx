"use client";

import { useState } from "react";

import { useUser } from "@clerk/nextjs";

interface EmailVerificationBannerProps {
  daysRemaining: number;
  email: string;
  expired?: boolean;
}

const getVerifyRedirectUrl = () => {
  if (typeof window === "undefined") {
    return "/auth/verify";
  }

  return new URL("/auth/verify", window.location.origin).toString();
};

const getErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || error == null || !("errors" in error)) {
    return "Nie udało się wysłać maila weryfikacyjnego.";
  }

  const message = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]
    ?.longMessage ??
    (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]?.message;

  return message ? String(message) : "Nie udało się wysłać maila weryfikacyjnego.";
};

export const EmailVerificationBanner = ({ daysRemaining, email, expired = false }: EmailVerificationBannerProps) => {
  const { isLoaded, user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"info" | "error">("info");

  const handleResend = async () => {
    if (!isLoaded || !user?.primaryEmailAddress) {
      setStatusType("error");
      setStatusMessage("Nie udało się odczytać głównego adresu e-mail dla tego konta.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await user.primaryEmailAddress.prepareVerification({
        strategy: "email_link",
        redirectUrl: getVerifyRedirectUrl(),
      });

      setStatusType("info");
      setStatusMessage(`Wysłaliśmy nowy link weryfikacyjny na ${email}.`);
    } catch (error) {
      setStatusType("error");
      setStatusMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`wf-flash ${expired ? "error" : "info"}`}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong>
            {expired
              ? "Dostęp do panelu został wstrzymany do czasu weryfikacji e-mail."
              : `Konto nie jest jeszcze zweryfikowane. Możesz korzystać z niego jeszcze przez ${daysRemaining} dni.`}
          </strong>
          <span>
            Zweryfikuj adres {email}, aby potwierdzić konto w Clerk i nie stracić dostępu.
          </span>
        </div>

        <button className="wf-btn wf-btn-secondary" disabled={isSubmitting} onClick={handleResend} type="button">
          {isSubmitting ? "Wysyłanie..." : "Wyślij mail ponownie"}
        </button>
      </div>

      {statusMessage ? (
        <div className={`wf-flash ${statusType}`} style={{ marginTop: 12 }}>
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
};