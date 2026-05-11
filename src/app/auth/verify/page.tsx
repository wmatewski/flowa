"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useClerk } from "@clerk/nextjs";

const getErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || error == null || !("errors" in error)) {
    return "Nie udało się potwierdzić linku.";
  }

  const message = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]
    ?.longMessage ??
    (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]?.message;

  return message ? String(message) : "Nie udało się potwierdzić linku.";
};

export default function AuthVerifyPage() {
  const clerk = useClerk();
  const handledRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedOnOtherDevice, setVerifiedOnOtherDevice] = useState(false);

  useEffect(() => {
    if (!clerk.loaded || handledRef.current) {
      return;
    }

    handledRef.current = true;

    void clerk
      .handleEmailLinkVerification({
        redirectUrl: "/auth",
        redirectUrlComplete: "/auth",
        onVerifiedOnOtherDevice: () => {
          setVerifiedOnOtherDevice(true);
        },
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error));
      });
  }, [clerk]);

  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        <section className="wf-auth-card">
          <div className="wf-auth-header">
            <div className="wf-auth-subtitle">Weryfikacja</div>
            <h1>Sprawdzamy link</h1>
            <p className="wf-page-subtitle" style={{ marginTop: 0 }}>
              {errorMessage
                ? errorMessage
                : verifiedOnOtherDevice
                  ? "Link został potwierdzony na innym urządzeniu. Możesz wrócić do logowania."
                  : "Za chwilę przeniesiemy Cię z powrotem do panelu logowania."}
            </p>
          </div>

          {errorMessage || verifiedOnOtherDevice ? (
            <div className="wf-auth-stage">
              <div className="wf-form-stack wf-auth-form wf-auth-stage-panel">
                <Link className="wf-btn wf-btn-secondary wf-btn-block" href="/auth">
                  Wróć do logowania
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}