"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { sanitizeInternalRedirectUrl } from "@/lib/redirect-url";

export default function AuthCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didRunRef = useRef(false);
  const redirectUrl = sanitizeInternalRedirectUrl(searchParams.get("redirect_url"), "/admin");

  useEffect(() => {
    if (didRunRef.current) {
      return;
    }

    didRunRef.current = true;
    let cancelled = false;

    const finalize = async () => {
      try {
        const response = await fetch("/api/auth/bootstrap", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("bootstrap-failed");
        }

        if (!cancelled) {
          router.replace(`/sign-up?oauth=google&redirect_url=${encodeURIComponent(redirectUrl)}`);
        }
      } catch {
        if (!cancelled) {
          router.replace(`/login?error=oauth-failed&redirect_url=${encodeURIComponent(redirectUrl)}`);
        }
      }
    };

    void finalize();

    return () => {
      cancelled = true;
    };
  }, [redirectUrl, router]);

  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        <section className="wf-auth-card wf-auth-loading-shell">
          <div className="wf-auth-header">
            <div className="wf-auth-subtitle">Konfiguracja</div>
            <h1>Przygotowujemy konto</h1>
            <p className="wf-page-subtitle" style={{ marginTop: 0 }}>
              Sprawdzamy profil i aktywujemy dostęp do organizacji lub konfiguracji nowego konta.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
