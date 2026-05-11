"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const oauthCompletionRedirectUrl = "/auth?mode=register&oauth=google";

export default function AuthCompletePage() {
  const router = useRouter();
  const didRunRef = useRef(false);

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
          router.replace(oauthCompletionRedirectUrl);
        }
      } catch {
        if (!cancelled) {
          router.replace("/auth?mode=login&error=oauth-failed");
        }
      }
    };

    void finalize();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        <section className="wf-auth-card wf-auth-loading-shell">
          <div className="wf-auth-header">
            <div className="wf-auth-subtitle">Clerk OAuth</div>
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