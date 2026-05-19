import Link from "next/link";

import { CopyButton } from "@/components/session/copy-button";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionWorkspaceSummary } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes, formatNumber } from "@/lib/format";
import { buildSessionPublicUrl } from "@/lib/public-session";

export default async function SessionLivePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { organization, membership, user } = await getAuthenticatedAdmin();
  const { session, overview } = await getSessionWorkspaceSummary(
    {
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
    sessionId,
  );
  const baseUrl = publicEnv.appUrl.replace(/\/$/, "");
  const liveUrl = `${baseUrl}/live/${sessionId}`;
  const embedUrl = `${liveUrl}?embed=1`;
  const publicUrl = buildSessionPublicUrl(baseUrl, session.id);
  const iframeCode = `<iframe src="${embedUrl}" title="${session.name} - wyniki na żywo" width="1280" height="720" style="border:0;width:100%;height:100%"></iframe>`;

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Wyniki na żywo</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>{session.name}</h1>
          <p className="wf-page-subtitle">Widok prezentacyjny oraz gotowy link embed do wyświetlania napływających odpowiedzi.</p>
        </div>

        <div className="wf-card-actions">
          <Link className="wf-btn wf-btn-secondary" href={`/live/${sessionId}`} target="_blank" rel="noopener noreferrer">
            Otwórz widok live
          </Link>
          <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj URL embed" value={embedUrl} />
        </div>
      </div>

      <section style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.85fr)" }}>
        <article className="wf-panel-card">
          <div className="wf-page-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Podgląd embeda</h3>
              <p className="wf-table-muted">To dokładnie ten widok, który możesz osadzić w prezentacji.</p>
            </div>
          </div>

            <div className="wf-live-frame-shell">
              <iframe className="wf-live-frame" src={`/live/${sessionId}?embed=1`} title={`${session.name} live embed`} />
            </div>
        </article>

        <aside className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card">
            <h3>Linki i embed</h3>
            <div className="wf-form-stack" style={{ marginTop: 16 }}>
              <label className="wf-field">
                <span className="wf-field-label">Publiczny widok live</span>
                <input className="wf-input" readOnly type="text" value={liveUrl} />
              </label>
              <label className="wf-field">
                <span className="wf-field-label">Kod iframe</span>
                <textarea className="wf-textarea wf-code-block" readOnly rows={7} style={{ minHeight: 180 }} value={iframeCode} />
              </label>
            </div>

            <div className="wf-card-actions" style={{ marginTop: 16 }}>
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link live" value={liveUrl} />
              <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj iframe" value={iframeCode} />
            </div>
          </article>

          <article className="wf-panel-card">
            <h3>Stan sesji</h3>
            <div className="wf-member-list">
              <div className="wf-member-row">
                <span>Odpowiedzi</span>
                <strong>{formatNumber(overview?.participant_count)}</strong>
              </div>
              <div className="wf-member-row">
                <span>Średni czas</span>
                <strong>{formatMinutes(overview?.average_minutes)}</strong>
              </div>
              <div className="wf-member-row">
                <span>Publiczna ankieta</span>
                <strong style={{ wordBreak: "break-all", textAlign: "right" }}>{publicUrl}</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
