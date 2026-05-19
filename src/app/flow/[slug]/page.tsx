import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Smartphone } from "lucide-react";

import { SessionEntryState } from "@/components/user/session-entry-state";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, getOperatingSystemConfig, isOperatingSystem, operatingSystemOrder } from "@/lib/os";

export default async function FlowSessionPage({
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
  const operatingSystemConfig = getOperatingSystemConfig(selectedOperatingSystem);

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
            <span>Krok 2 z 4</span>
            <span>Instrukcja</span>
          </div>
          <div className="wf-step-progress-bar">
            <div className="wf-step-progress-fill" style={{ width: "50%" }} />
          </div>
        </div>

        <form action={`/flow/${slug}/time`} className="wf-step-card" method="get">
          <input name="age" type="hidden" value={String(age)} />

          <div>
            <h1 className="wf-step-title">Jak sprawdzić czas przed ekranem?</h1>
            <p className="wf-step-description">
              {data.organization.name}. Przejdziemy teraz przez odczyt wyniku na urządzeniu uczestnika.
            </p>
          </div>

          <section className="wf-step-note">
            <div className="wf-inline-meta" style={{ color: "var(--text)", fontWeight: 700 }}>
              <Smartphone size={18} />
              Wykryty system: {operatingSystemConfig.label}
            </div>

            <div className="wf-step-system-row" style={{ marginTop: 12 }}>
              <div>
                <strong>{operatingSystemConfig.shortLabel}</strong>
                <p className="wf-table-muted" style={{ margin: "6px 0 0" }}>{operatingSystemConfig.description}</p>
              </div>
              <select className="wf-input wf-step-system-select" defaultValue={selectedOperatingSystem} name="os">
                {operatingSystemOrder.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {getOperatingSystemConfig(candidate).label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="wf-step-list">
            {operatingSystemConfig.steps.map((step, index) => (
              <div key={step}>
                <div className="wf-step-list-item">
                  <div className="wf-step-index">{index + 1}</div>
                  <div>{step}</div>
                </div>
                {index < operatingSystemConfig.steps.length - 1 ? <div className="wf-step-divider" /> : null}
              </div>
            ))}
          </div>

          <div className="wf-step-actions">
            {data.session.age_mode === "variable" ? (
              <Link className="wf-btn wf-btn-secondary" href={`/flow/${slug}/age`}>
                Wróć do wieku
              </Link>
            ) : <span />}
            <button className="wf-btn wf-btn-primary" type="submit">
              Dalej
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
