import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";

import { submitSessionEntryAction } from "@/app/actions";
import { ScreenTimeStepForm } from "@/components/user/screen-time-step-form";
import { SessionEntryState } from "@/components/user/session-entry-state";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, getOperatingSystemConfig, isOperatingSystem } from "@/lib/os";
import type { FlashMessage, OperatingSystem } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.error === "invalid-time") {
    return { type: "error", message: "Podaj poprawny czas w formacie godziny:minuty, np. 2:30." };
  }

  if (params.error === "save-failed") {
    return { type: "error", message: "Nie udało się zapisać wyniku. Spróbuj ponownie za chwilę." };
  }

  return null;
};

export default async function PublicSessionTimePage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const participantKey = cookieStore.get(publicEnv.sessionCookieName)?.value ?? "";
  const detectedOperatingSystem = detectOperatingSystem(headerStore.get("user-agent"));
  const data = await getPublicSessionExperienceData(sessionId, participantKey, detectedOperatingSystem);
  const requestedAge = query.age ? Number(query.age) : null;
  const age = data.session.age_mode === "fixed" ? data.session.fixed_age : requestedAge;
  const initialMinutes = data.latestSubmission?.screen_time_minutes ?? null;

  if (data.latestSubmission) {
    redirect(`/ankieta/${sessionId}/submitted`);
  }

  if (!age) {
    redirect(`/ankieta/${sessionId}/age`);
  }

  const selectedOperatingSystem =
    typeof query.os === "string" && isOperatingSystem(query.os)
      ? query.os
      : data.detectedOperatingSystem;
  const operatingSystemConfig = getOperatingSystemConfig(selectedOperatingSystem as OperatingSystem);
  const flash = getFlashMessage(query);
  const totalSteps = data.session.age_mode === "variable" ? 4 : 3;
  const currentStep = data.session.age_mode === "variable" ? 3 : 2;
  const progress = `${Math.round((currentStep / totalSteps) * 100)}%`;

  return (
    <>
      <main className="wf-step-shell">
        <SessionEntryState sessionSlug={sessionId} />
        <div className="wf-step-container wf-step-container-animated">
          <div className="wf-step-topbar">
            <Link className="wf-brand" href="/">
              <div className="wf-brand-mark">
                <Leaf size={16} />
              </div>
              <span>{data.organization.name}</span>
            </Link>
            <div className="wf-inline-meta">
              <span>powered by Wojticore Flowa</span>
              <Link className="wf-link-button" href="/guides">
                Pomoc
              </Link>
            </div>
          </div>

          <div className="wf-step-progress">
            <div className="wf-inline-meta" style={{ justifyContent: "space-between" }}>
              <span>Krok {currentStep} z {totalSteps}</span>
              <span>{data.session.name}</span>
            </div>
            <div className="wf-step-progress-bar">
              <div className="wf-step-progress-fill" style={{ width: progress }} />
            </div>
          </div>

          <section className="wf-step-card wf-step-panel-animated">
            <div>
              <h1 className="wf-step-title">Wpisz czas przed ekranem</h1>
              <p className="wf-step-description">
                Dla systemu {operatingSystemConfig.label}. Podaj dzisiejszy wynik w godzinach i minutach.
              </p>
            </div>

            {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

            <ScreenTimeStepForm
              age={age}
              initialMinutes={initialMinutes}
              operatingSystem={selectedOperatingSystem as OperatingSystem}
              sessionId={data.session.id}
              sessionSlug={data.session.id}
              submitAction={submitSessionEntryAction}
            />

            <div className="wf-step-actions">
              <Link className="wf-btn wf-btn-secondary" href={`/ankieta/${sessionId}?age=${age}&os=${selectedOperatingSystem}`}>
                Wróć do instrukcji
              </Link>
            </div>
          </section>
        </div>
      </main>
      <footer className="wf-footer">
        <div className="wf-footer-inner">
          <Link href="/">Made with Wojticore Flowa</Link>
        </div>
      </footer>
    </>
  );
}
