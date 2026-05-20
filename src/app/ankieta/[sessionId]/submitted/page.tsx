import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SessionEntryState } from "@/components/user/session-entry-state";
import {
  PublicSurveyShell,
  buildPublicSurveyStepItems,
} from "@/components/user/public-survey-shell";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, isOperatingSystem } from "@/lib/os";

export default async function PublicSessionSubmittedPage({
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
  const selectedOperatingSystem =
    typeof query.os === "string" && isOperatingSystem(query.os)
      ? query.os
      : detectedOperatingSystem;
  const data = await getPublicSessionExperienceData(sessionId, participantKey, selectedOperatingSystem);

  if (!data.latestSubmission) {
    redirect(`/ankieta/${sessionId}`);
  }

  const hasAgeStep = data.session.age_mode === "variable";
  const totalSteps = hasAgeStep ? 4 : 3;
  const participantMessage =
    data.participantInsight?.description ??
    "Dziekujemy za przeslanie odpowiedzi. Twoj wynik zostal zapisany w tej prezentacji.";
  const participantLabel = data.participantInsight?.label ?? "Odpowiedz zapisana";

  return (
    <>
      <SessionEntryState mode="reset" sessionId={sessionId} />
      <PublicSurveyShell
        actions={
          <div className="wf-survey-success-actions">
            <Link className="wf-survey-action wf-survey-action-primary" href="/">
              <span>Zakoncz</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        }
        description="Ostatni krok pokazuje tylko potwierdzenie i komunikat z ustawien sesji lub organizacji."
        organizationName={data.organization.name}
        sidebarDescription={`Ankieta "${data.session.name}" zostala zakonczona. Wynik jest juz zapisany i gotowy do analizy.`}
        step={totalSteps}
        stepItems={buildPublicSurveyStepItems(hasAgeStep, totalSteps)}
        title="Dziekujemy za przeslanie odpowiedzi!"
        totalSteps={totalSteps}
      >
        <div className="wf-survey-success-card">
          <div className="wf-survey-success-icon">
            <CheckCircle2 size={40} />
          </div>

          <div className="wf-survey-success-copy">
            <p className="wf-survey-success-label">{participantLabel}</p>
            <p className="wf-survey-success-message">{participantMessage}</p>
          </div>
        </div>
      </PublicSurveyShell>
    </>
  );
}
