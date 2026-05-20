"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LiveAuthorizationRequestState {
  requestId: string;
  authorizationCode: string;
  status: "pending" | "authorized" | "expired";
}

interface LiveAuthorizationScreenProps {
  sessionId: string;
  initialRequest: LiveAuthorizationRequestState | null;
}

const formatAuthorizationCode = (value: string) => {
  const normalized = value.replace(/\D/g, "").slice(0, 6);

  if (normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
};

export const LiveAuthorizationScreen = ({
  sessionId,
  initialRequest,
}: LiveAuthorizationScreenProps) => {
  const router = useRouter();
  const [request, setRequest] = useState<LiveAuthorizationRequestState | null>(initialRequest);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!request?.requestId) {
      return;
    }

    const url = new URL(window.location.href);

    if (url.searchParams.get("request") === request.requestId) {
      return;
    }

    url.searchParams.set("request", request.requestId);
    window.history.replaceState(null, "", url);
  }, [request?.requestId]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const response = await fetch(`/api/live-display/${sessionId}/bootstrap`, {
          method: "POST",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("bootstrap-failed");
        }

        const nextState = (await response.json()) as LiveAuthorizationRequestState;

        if (cancelled) {
          return;
        }

        if (nextState.status === "authorized") {
          router.refresh();
          return;
        }

        setRequest(nextState);
        setErrorMessage(null);
      } catch {
        if (!cancelled) {
          setErrorMessage("Nie udalo sie przygotowac kodu autoryzacji. Odswiez ekran i sprobuj ponownie.");
        }
      }
    };

    if (!request) {
      void bootstrap();
    }

    return () => {
      cancelled = true;
    };
  }, [request, router, sessionId]);

  useEffect(() => {
    if (!request?.requestId) {
      return;
    }

    let cancelled = false;

    const refreshStatus = async () => {
      try {
        const response = await fetch(`/api/live-display/requests/${request.requestId}/status`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const nextState = (await response.json()) as LiveAuthorizationRequestState;

        if (cancelled) {
          return;
        }

        if (nextState.status === "authorized") {
          router.refresh();
          return;
        }

        setRequest(nextState);
      } catch {
        return;
      }
    };

    void refreshStatus();
    const intervalId = window.setInterval(refreshStatus, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [request?.requestId, router, sessionId]);

  return (
    <main className="wf-link-presentation-shell">
      <div className="wf-link-brand wf-link-brand-presentation">Wojticore Flowa</div>

      <div className="wf-link-presentation-center">
        <div className="wf-link-presentation-stack">
          <div className="wf-link-code-meta">Kod autoryzacji</div>

          <div className="wf-link-code-display-card">
            <span>{formatAuthorizationCode(request?.authorizationCode ?? "...")}</span>
          </div>

          <div className="wf-link-instruction-card">
            <p>
              Wpisz ten kod na stronie
              <br />
              <strong>flowa.wojticore.pl/link</strong>
              <br />
              aby autoryzowac urzadzenie
            </p>
          </div>

          <div className="wf-link-secure-note">Bezpieczne polaczenie</div>

          {errorMessage ? <div className="wf-flash error">{errorMessage}</div> : null}
        </div>
      </div>
    </main>
  );
};
