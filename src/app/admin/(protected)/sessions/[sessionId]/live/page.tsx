import Link from "next/link";

import { CopyButton } from "@/components/session/copy-button";
import { Button } from "@/components/ui/button";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionWorkspaceSummary } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes, formatNumber } from "@/lib/format";
import { buildSessionPublicUrl } from "@/lib/public-session";
import { escapeHtmlAttribute } from "@/lib/html";

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
  const publicUrl = buildSessionPublicUrl(baseUrl, session.id);
  const iframeCode = `<iframe src="${escapeHtmlAttribute(liveUrl)}" title="${escapeHtmlAttribute(`${session.name} - widok na zywo`)}" width="1280" height="720" style="border:0;width:100%;height:100%"></iframe>`;

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Wyniki na żywo</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>{session.name}</h1>
          <p className="wf-page-subtitle">Podgląd live uruchamia kod autoryzacji, a po potwierdzeniu pokazuje wyniki.</p>
        </div>

        <div className="wf-card-actions">
          <Button asChild variant="secondary">
            <Link href={`/live/${sessionId}`} target="_blank" rel="noopener noreferrer">
              Otwórz podgląd
            </Link>
          </Button>
          <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj link podgladu" value={liveUrl} />
        </div>
      </div>

      <section style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.85fr)" }}>
        <article className="wf-panel-card">
          <div className="wf-page-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Podgląd na żywo</h3>
              <p className="wf-table-muted">Na ekranie najpierw pokaże się 6-cyfrowy kod, a po autoryzacji wyniki live.</p>
            </div>
            </div>

            <div className="wf-live-frame-shell">
              <iframe className="wf-live-frame" src={liveUrl} title={`${session.name} - widok na zywo`} />
            </div>
        </article>

        <aside className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card">
            <h3>Udostępnianie</h3>
            <div className="wf-form-stack" style={{ marginTop: 16 }}>
              <label className="wf-field">
                <span className="wf-field-label">Link do podglądu</span>
                <input className="wf-input" readOnly type="text" value={liveUrl} />
                <span className="wf-table-muted">To ten adres otwierasz w Canvie lub na ekranie prezentacji.</span>
              </label>
              <label className="wf-field">
                <span className="wf-field-label">Gotowy fragment strony</span>
                <textarea className="wf-textarea wf-code-block" readOnly rows={7} style={{ minHeight: 180 }} value={iframeCode} />
                <span className="wf-table-muted">Po osadzeniu ekran poprosi o autoryzacje 6-cyfrowym kodem na `/link`.</span>
              </label>
            </div>

            <div className="wf-card-actions" style={{ marginTop: 16 }}>
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link" value={liveUrl} />
              <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj fragment" value={iframeCode} />
            </div>
          </article>

          <article className="wf-panel-card">
            <h3>Podsumowanie</h3>
            <div className="wf-member-list">
              <div className="wf-member-row">
                <span>Liczba odpowiedzi</span>
                <strong>{formatNumber(overview?.participant_count)}</strong>
              </div>
              <div className="wf-member-row">
                <span>Średni czas</span>
                <strong>{formatMinutes(overview?.average_minutes)}</strong>
              </div>
              <div className="wf-member-row">
                <span>Link uczestnika</span>
                <strong style={{ wordBreak: "break-all", textAlign: "right" }}>{publicUrl}</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
