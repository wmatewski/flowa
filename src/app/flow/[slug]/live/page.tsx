import Link from "next/link";

import { CopyButton } from "@/components/session/copy-button";
import { LiveResultsTable } from "@/components/session/live-results-table";
import { getPublicLiveSessionData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";

export default async function PublicLiveSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const embed = query.embed === "1";
  const data = await getPublicLiveSessionData(slug);
  const liveUrl = `${publicEnv.appUrl.replace(/\/$/, "")}/flow/${slug}/live`;

  return (
    <main className={`wf-live-page${embed ? " is-embed" : ""}`}>
      <div className="wf-live-page-shell">
        <header className="wf-live-page-header">
          <div>
            <div className="wf-badge">Wyniki na żywo</div>
            <h1 className="wf-page-title" style={{ marginTop: 16 }}>{data.session.name}</h1>
            <p className="wf-page-subtitle">
              Publiczny widok do prezentacji i osadzania w materiałach na żywo.
            </p>
          </div>

          {!embed ? (
            <div className="wf-card-actions">
              <Link className="wf-btn wf-btn-secondary" href={`/flow/${slug}`}>
                Otwórz ankietę
              </Link>
              <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj link live" value={liveUrl} />
            </div>
          ) : null}
        </header>

        <LiveResultsTable
          embed={embed}
          initialAverageMinutes={data.overview?.average_minutes ?? null}
          initialEntries={data.entries}
          initialParticipantCount={data.overview?.participant_count ?? data.entries.length}
          slug={slug}
        />

        {!embed ? (
          <div className="wf-live-banner">
            <div>
              <strong>Embed do prezentacji</strong>
              <p className="wf-table-muted" style={{ marginTop: 6 }}>
                Użyj tego linku w iframe albo wyświetl go bezpośrednio na drugim ekranie.
              </p>
            </div>
            <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj URL embed" value={`${liveUrl}?embed=1`} />
          </div>
        ) : null}
      </div>
    </main>
  );
}