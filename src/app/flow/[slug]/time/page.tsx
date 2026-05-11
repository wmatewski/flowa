import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";

import { submitSessionEntryAction } from "@/app/actions";
import { SessionEntryState } from "@/components/user/session-entry-state";
import { ScreenTimeStepForm } from "@/components/user/screen-time-step-form";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes } from "@/lib/format";
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

export default async function FlowTimePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const participantKey = cookieStore.get(publicEnv.sessionCookieName)?.value ?? "";
  const detectedOperatingSystem = detectOperatingSystem(headerStore.get("user-agent"));
  const data = await getPublicSessionExperienceData(slug, participantKey, detectedOperatingSystem);
  const requestedAge = query.age ? Number(query.age) : null;
  const age = data.session.age_mode === "fixed" ? data.session.fixed_age : requestedAge;

  if (!age) {
    redirect(`/flow/${slug}/age`);
  }

  const selectedOperatingSystem =
    typeof query.os === "string" && isOperatingSystem(query.os)
      ? query.os
      : data.detectedOperatingSystem;
  const operatingSystemConfig = getOperatingSystemConfig(selectedOperatingSystem as OperatingSystem);
  const flash = getFlashMessage(query);

  return (
    <main className="wf-step-shell">
      <SessionEntryState sessionSlug={slug} />
      <div className="wf-step-container">
        <div className="wf-step-topbar">
          <Link className="wf-brand" href="/">
            <span>Wojticore Flowa</span>
          </Link>
          <Link className="wf-link-button" href="/guides">
            Pomoc
          </Link>
        </div>

        <div className="wf-step-progress">
          <div className="wf-inline-meta" style={{ justifyContent: "space-between" }}>
            <span>Krok 3 z 4</span>
            <span>{data.session.name}</span>
          </div>
          <div className="wf-step-progress-bar">
            <div className="wf-step-progress-fill" style={{ width: "75%" }} />
          </div>
        </div>

        <section className="wf-step-card">
          <div>
            <h1 className="wf-step-title">Wpisz czas przed ekranem</h1>
            <p className="wf-step-description">
              Dla systemu {operatingSystemConfig.label}. Podaj dzisiejszy wynik w godzinach i minutach.
            </p>
          </div>

          <div className="wf-step-note">
            <div className="wf-inline-meta" style={{ color: "var(--text)", fontWeight: 700 }}>
              <Clock3 size={18} />
              Limit tej sesji: {formatMinutes(data.session.screen_time_limit_minutes)}
            </div>
            <p style={{ margin: "8px 0 0" }}>
              Ostatni zapisany wynik: {formatMinutes(data.latestSubmission?.screen_time_minutes)}. Możesz go nadpisać nowym wpisem.
            </p>
          </div>

          {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

          <ScreenTimeStepForm
            age={age}
            initialMinutes={data.latestSubmission?.screen_time_minutes ?? null}
            operatingSystem={selectedOperatingSystem as OperatingSystem}
            sessionId={data.session.id}
            sessionSlug={data.session.slug}
            submitAction={submitSessionEntryAction}
          />

          <div className="wf-step-actions">
            <Link className="wf-btn wf-btn-secondary" href={`/flow/${slug}?age=${age}&os=${selectedOperatingSystem}`}>
              Wróć do instrukcji
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
