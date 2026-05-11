import { BarChart3, Download, QrCode, Radio } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CopyButton } from "@/components/session/copy-button";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionStatisticsData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatDateTime, formatMinutes, formatNumber } from "@/lib/format";

export default async function SessionOverviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { organization, membership, user } = await getAuthenticatedAdmin();
  const data = await getSessionStatisticsData(
    {
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
    sessionId,
  );
  const baseUrl = publicEnv.appUrl.replace(/\/$/, "");
  const publicUrl = `${baseUrl}/flow/${data.session.slug}`;
  const liveUrl = `${baseUrl}/flow/${data.session.slug}/live`;
  const embedUrl = `${liveUrl}?embed=1`;
  const qrCodeDataUrl = await (await import("qrcode")).toDataURL(publicUrl, {
    margin: 1,
    width: 320,
    color: {
      dark: "#1a1c1e",
      light: "#ffffff",
    },
  });
  const participantCount = data.overview?.participant_count ?? data.participants.length;
  const latestParticipants = [...data.participants]
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
    .slice(0, 8);

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Przegląd ankiety</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>{data.session.name}</h1>
          <p className="wf-page-subtitle">
            Szybki podgląd linków, QR kodu i najnowszych odpowiedzi bez opuszczania workspace ankiety.
          </p>
        </div>

        <div className="wf-card-actions">
          <Link className="wf-btn wf-btn-secondary" href={`/admin/sessions/${sessionId}/analytics`}>
            <BarChart3 size={18} />
            Otwórz analitykę
          </Link>
          <Link className="wf-btn wf-btn-primary" href={`/admin/sessions/${sessionId}/live`}>
            <Radio size={18} />
            Tryb live
          </Link>
        </div>
      </div>

      <section className="wf-metric-grid" style={{ marginBottom: 24 }}>
        <article className="wf-metric-card">
          <h3>Liczba odpowiedzi</h3>
          <div className="wf-metric-value">{formatNumber(participantCount)}</div>
        </article>
        <article className="wf-metric-card">
          <h3>Średni czas</h3>
          <div className="wf-metric-value">{formatMinutes(data.overview?.average_minutes)}</div>
        </article>
        <article className="wf-metric-card">
          <h3>Poziom skupienia</h3>
          <div className="wf-metric-value">{data.focusScore.score}</div>
          <div className="wf-table-muted">{data.focusScore.label}</div>
        </article>
      </section>

      <section style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.8fr)" }}>
        <div className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card wf-live-overview-card">
            <div className="wf-page-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Prezentacja i live</h3>
                <p className="wf-table-muted">Przełącz się do trybu wyników na żywo lub osadź widok w prezentacji.</p>
              </div>
              <div className="wf-pill wf-pill-soft">Embed ready</div>
            </div>

            <div className="wf-card-actions">
              <Link className="wf-btn wf-btn-primary" href={`/admin/sessions/${sessionId}/live`}>
                Otwórz panel live
              </Link>
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link embed" value={embedUrl} />
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link ankiety" value={publicUrl} />
            </div>
          </article>

          <article className="wf-table-card">
            <div className="wf-page-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Ostatnie odpowiedzi</h3>
                <p className="wf-table-muted">Najnowsze wpisy respondentów w tej ankiecie.</p>
              </div>
            </div>

            <div className="wf-table-head" style={{ gridTemplateColumns: "1fr 0.6fr 0.7fr 0.8fr" }}>
              <span>Czas wpisu</span>
              <span>Wiek</span>
              <span>Czas przed ekranem</span>
              <span>Status</span>
            </div>

            <div>
              {latestParticipants.length ? (
                latestParticipants.map((participant) => (
                  <div
                    className="wf-table-row"
                    key={participant.id}
                    style={{ display: "grid", gridTemplateColumns: "1fr 0.6fr 0.7fr 0.8fr", gap: 16 }}
                  >
                    <div>{formatDateTime(participant.submittedAt)}</div>
                    <div>{participant.age}</div>
                    <div>{formatMinutes(participant.screenTimeMinutes)}</div>
                    <div>
                      <span className={`wf-status-chip ${participant.statusTone}`}>{participant.statusLabel}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="wf-empty" style={{ marginTop: 20 }}>Brak odpowiedzi do wyświetlenia.</p>
              )}
            </div>
          </article>
        </div>

        <aside className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card wf-qr-card">
            <div className="wf-page-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Kod QR do ankiety</h3>
                <p className="wf-table-muted">Udostępnij uczestnikom szybki dostęp do formularza.</p>
              </div>
              <QrCode size={20} />
            </div>

            <Image
              alt={`Kod QR dla ${data.session.name}`}
              className="wf-qr-image"
              height={320}
              src={qrCodeDataUrl}
              width={320}
            />

            <div className="wf-card-actions">
              <a className="wf-btn wf-btn-secondary" download={`qr-${data.session.slug}.png`} href={qrCodeDataUrl}>
                <Download size={18} />
                Pobierz QR
              </a>
              <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj link" value={publicUrl} />
            </div>
          </article>

          <article className="wf-panel-card">
            <h3>Linki sesji</h3>
            <div className="wf-form-stack" style={{ marginTop: 16 }}>
              <label className="wf-field">
                <span className="wf-field-label">Ankieta publiczna</span>
                <input className="wf-input" readOnly type="text" value={publicUrl} />
              </label>
              <label className="wf-field">
                <span className="wf-field-label">Wyniki na żywo</span>
                <input className="wf-input" readOnly type="text" value={liveUrl} />
              </label>
            </div>
          </article>

          <article className="wf-panel-card">
            <h3>Współtwórcy sesji</h3>
            {data.collaborators.length ? (
              <div className="wf-member-list">
                {data.collaborators.map((member) => (
                  <div className="wf-member-row" key={member.membershipId}>
                    <div>
                      <div className="wf-member-name">{member.displayName}</div>
                      <div className="wf-table-muted">{member.email}</div>
                    </div>
                    <span className="wf-pill">{member.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="wf-empty">Ta ankieta nie ma jeszcze przypisanych współtwórców.</p>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}