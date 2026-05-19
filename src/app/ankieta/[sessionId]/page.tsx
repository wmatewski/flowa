import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";

import { PublicOperatingSystemStep } from "@/components/user/public-operating-system-step";
import { SessionEntryState } from "@/components/user/session-entry-state";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, isOperatingSystem } from "@/lib/os";

export default async function PublicSessionInstructionsPage({
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
  const totalSteps = data.session.age_mode === "variable" ? 4 : 3;
  const currentStep = data.session.age_mode === "variable" ? 2 : 1;
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
              <span>Instrukcja</span>
            </div>
            <div className="wf-step-progress-bar">
              <div className="wf-step-progress-fill" style={{ width: progress }} />
            </div>
          </div>

          <PublicOperatingSystemStep
            age={age}
            initialOperatingSystem={selectedOperatingSystem}
            organizationName={data.organization.name}
            sessionId={sessionId}
            showBackLink={data.session.age_mode === "variable"}
          />
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
