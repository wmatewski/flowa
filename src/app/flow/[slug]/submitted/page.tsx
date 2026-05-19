import { cookies, headers } from "next/headers";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SessionEntryState } from "@/components/user/session-entry-state";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes } from "@/lib/format";
import { detectOperatingSystem, isOperatingSystem } from "@/lib/os";

export default async function FlowSubmittedPage({
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
  const selectedOperatingSystem =
    typeof query.os === "string" && isOperatingSystem(query.os)
      ? query.os
      : detectedOperatingSystem;
  const data = await getPublicSessionExperienceData(slug, participantKey, selectedOperatingSystem);

  return (
    <main className="wf-step-shell">
      <SessionEntryState mode="reset" sessionSlug={slug} />
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
            <span>Krok 4 z 4</span>
            <span>Podsumowanie</span>
          </div>
          <div className="wf-step-progress-bar">
            <div className="wf-step-progress-fill" style={{ width: "100%" }} />
          </div>
        </div>

        <section className="wf-step-card wf-step-success-card">
          <div className="wf-step-success-icon">
            <CheckCircle2 size={40} />
          </div>

          <div>
            <h1 className="wf-step-title">Wynik zapisany</h1>
            <p className="wf-step-description">Twoja odpowiedź została dodana do sesji {data.session.name}.</p>
          </div>

          <div className="wf-step-note">
            <strong>Twój wynik</strong>
            <p style={{ margin: "8px 0 0" }}>
              Zapisano {formatMinutes(data.latestSubmission?.screen_time_minutes)}. Średnia sesji wynosi {formatMinutes(data.sessionAverageMinutes)}.
            </p>
          </div>

          {data.participantInsight ? (
            <div className={`wf-flash ${data.participantInsight.tone === "optimal" ? "success" : data.participantInsight.tone === "warning" ? "info" : "error"}`}>
              {data.participantInsight.description}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
