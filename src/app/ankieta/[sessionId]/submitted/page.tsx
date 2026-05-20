import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Leaf } from "lucide-react";

import { SessionEntryState } from "@/components/user/session-entry-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes } from "@/lib/format";
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

  const totalSteps = data.session.age_mode === "variable" ? 4 : 3;
  const currentStep = totalSteps;
  const progress = "100%";

  return (
    <>
      <main className="wf-step-shell">
        <SessionEntryState mode="reset" sessionId={sessionId} />
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
              <span>Podsumowanie</span>
            </div>
            <div className="wf-step-progress-bar">
              <div className="wf-step-progress-fill" style={{ width: progress }} />
            </div>
          </div>

          <Card className="wf-step-card wf-step-success-card wf-step-panel-animated">
            <CardHeader>
              <div className="wf-step-success-icon">
                <CheckCircle2 size={40} />
              </div>
              <Badge variant="secondary">Zakończono</Badge>
              <CardTitle style={{ margin: 0 }}>Wynik zapisany</CardTitle>
              <CardDescription>Twoja odpowiedź została dodana do sesji {data.session.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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

              <Button asChild className="w-full" variant="secondary">
                <Link href="/">Wróć na stronę główną</Link>
              </Button>
            </CardContent>
          </Card>
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
