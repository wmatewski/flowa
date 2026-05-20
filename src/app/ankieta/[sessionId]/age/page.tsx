import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SessionEntryState } from "@/components/user/session-entry-state";
import {
  PublicSurveyShell,
  buildPublicSurveyStepItems,
} from "@/components/user/public-survey-shell";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem } from "@/lib/os";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (error: string | undefined): FlashMessage | null => {
  if (error === "invalid-age") {
    return { type: "error", message: "Podaj poprawny wiek w przedziale 1-120." };
  }

  return null;
};

export default async function PublicSessionAgePage({
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

  if (!data.session) {
    redirect("/");
  }

  if (data.latestSubmission) {
    redirect(`/ankieta/${sessionId}/submitted`);
  }

  if (data.session.age_mode !== "variable") {
    redirect(`/ankieta/${sessionId}`);
  }

  const flash = getFlashMessage(query.error ? String(query.error) : undefined);

  return (
    <main>
      <SessionEntryState sessionId={sessionId} />
      <PublicSurveyShell
        actions={
          <div className="wf-survey-action-bar">
            <Link className="wf-survey-action wf-survey-action-secondary" href="/">
              <ArrowLeft size={18} />
              <span>Wstecz</span>
            </Link>
            <button
              className="wf-survey-action wf-survey-action-primary"
              form="wf-age-form"
              type="submit"
            >
              <span>Dalej</span>
              <ArrowRight size={18} />
            </button>
          </div>
        }
        description="Wprowadzenie wieku pomaga dopasowac wynik do odpowiedniej grupy i pokazac bardziej trafny komunikat koncowy."
        organizationName={data.organization.name}
        sidebarDescription={`Ankieta "${data.session.name}" zajmie chwile. Zaczynamy od wieku, aby dalsza analiza byla lepiej dopasowana.`}
        step={1}
        stepItems={buildPublicSurveyStepItems(true, 1)}
        title="Podaj swoj wiek"
        topbarLeading={
          <Link aria-label="Wstecz" className="wf-survey-icon-button" href="/">
            <ArrowLeft size={18} />
          </Link>
        }
        totalSteps={4}
      >
        <div className="wf-survey-form-stack">
          {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

          <form action={`/ankieta/${sessionId}`} className="wf-survey-age-form" id="wf-age-form" method="get">
            <label className="wf-survey-age-input-shell" htmlFor="age">
              <span className="wf-survey-age-input-label">Wiek uczestnika</span>
              <input
                className="wf-survey-age-input"
                id="age"
                inputMode="numeric"
                max={120}
                min={1}
                name="age"
                placeholder="Np. 30"
                type="number"
              />
            </label>
          </form>
        </div>
      </PublicSurveyShell>
    </main>
  );
}
