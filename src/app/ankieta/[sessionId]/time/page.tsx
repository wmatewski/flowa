import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { submitSessionEntryAction } from "@/app/actions";
import {
  PublicSurveyShell,
  buildPublicSurveyStepItems,
} from "@/components/user/public-survey-shell";
import { ScreenTimeStepForm } from "@/components/user/screen-time-step-form";
import { SessionEntryState } from "@/components/user/session-entry-state";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, isOperatingSystem } from "@/lib/os";
import type { FlashMessage, OperatingSystem } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.error === "invalid-time") {
    return { type: "error", message: "Podaj poprawny czas w formacie godziny:minuty, np. 2:30." };
  }

  if (params.error === "save-failed") {
    return { type: "error", message: "Nie udalo sie zapisac wyniku. Sprobuj ponownie za chwile." };
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
  const flash = getFlashMessage(query);
  const hasAgeStep = data.session.age_mode === "variable";
  const totalSteps = hasAgeStep ? 4 : 3;
  const currentStep = hasAgeStep ? 3 : 2;

  return (
    <>
      <SessionEntryState sessionId={sessionId} />
      <PublicSurveyShell
        actions={
          <div className="wf-survey-action-bar">
            <Link
              className="wf-survey-action wf-survey-action-secondary"
              href={`/ankieta/${sessionId}?age=${age}&os=${selectedOperatingSystem}`}
            >
              <ArrowLeft size={18} />
              <span>Wstecz</span>
            </Link>
            <button
              className="wf-survey-action wf-survey-action-primary"
              form="wf-time-form"
              type="submit"
            >
              <span>Dalej</span>
              <ArrowRight size={18} />
            </button>
          </div>
        }
        description="Wpisz dzisiejszy czas przed ekranem w godzinach i minutach. Ten krok ma ten sam uklad na telefonie i komputerze."
        organizationName={data.organization.name}
        sidebarDescription={`Wybrany system jest juz ustawiony. Teraz wpisz wynik dla ankiety "${data.session.name}".`}
        step={currentStep}
        stepItems={buildPublicSurveyStepItems(hasAgeStep, currentStep)}
        title="Wpisz swoj czas przed ekranem"
        topbarLeading={
          <Link
            aria-label="Wstecz"
            className="wf-survey-icon-button"
            href={`/ankieta/${sessionId}?age=${age}&os=${selectedOperatingSystem}`}
          >
            <ArrowLeft size={18} />
          </Link>
        }
        totalSteps={totalSteps}
      >
        <div className="wf-survey-form-stack">
          {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

          <ScreenTimeStepForm
            age={age}
            formId="wf-time-form"
            initialMinutes={initialMinutes}
            operatingSystem={selectedOperatingSystem as OperatingSystem}
            sessionId={data.session.id}
            submitAction={submitSessionEntryAction}
          />
        </div>
      </PublicSurveyShell>
    </>
  );
}
