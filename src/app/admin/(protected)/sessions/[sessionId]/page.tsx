import { BarChart3, Download, QrCode, Radio } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CopyButton } from "@/components/session/copy-button";
import { Button } from "@/components/ui/button";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionStatisticsData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatDateTime, formatMinutes, formatNumber } from "@/lib/format";
import { buildSessionPublicUrl } from "@/lib/public-session";

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
  const publicUrl = buildSessionPublicUrl(baseUrl, data.session.id);
  const liveUrl = `${baseUrl}/live/${sessionId}`;
  const qrCodeDataUrl = await (await import("qrcode")).toDataURL(publicUrl, {
    margin: 1,
    width: 448,
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
            Szybki podgląd odpowiedzi, QR kodu i podglądu na żywo.
          </p>
        </div>

        <div className="wf-card-actions">
          <Button asChild variant="secondary">
            <Link href={`/admin/sessions/${sessionId}/analytics`}>
              <BarChart3 size={18} />
              Otwórz analitykę
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/sessions/${sessionId}/live`}>
              <Radio size={18} />
              Podgląd na żywo
            </Link>
          </Button>
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
                <h3 style={{ margin: 0 }}>Podgląd na żywo</h3>
                <p className="wf-table-muted">Przejdź do podglądu albo skopiuj link dla uczestników.</p>
              </div>
              <div className="wf-pill wf-pill-soft">Gotowe</div>
            </div>

            <div className="wf-card-actions">
              <Button asChild>
                <Link href={`/admin/sessions/${sessionId}/live`}>Otwórz podgląd</Link>
              </Button>
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link uczestnika" value={publicUrl} />
            </div>
          </article>

          <article className="wf-table-card">
            <div className="wf-page-header" style={{ marginBottom: 16 }}>
              <div>
              <h3 style={{ margin: 0 }}>Najnowsze odpowiedzi</h3>
              <p className="wf-table-muted">Najświeższe wpisy uczestników w tej ankiecie.</p>
              </div>
            </div>

            <div className="wf-table-head" style={{ gridTemplateColumns: "1fr 0.6fr 0.7fr 0.8fr" }}>
              <span>Czas wpisu</span>
              <span>Wiek</span>
              <span>Czas przed ekranem</span>
              <span>Ocena</span>
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
                <h3 style={{ margin: 0 }}>Szybki dostęp</h3>
                <p className="wf-table-muted">Udostępnij uczestnikom gotowy adres do formularza.</p>
              </div>
              <QrCode size={20} />
            </div>

            <Image
              alt={`Kod QR dla ${data.session.name}`}
              className="wf-qr-image"
              height={448}
              src={qrCodeDataUrl}
              width={448}
            />

            <div className="wf-card-actions">
              <a className="wf-btn wf-btn-secondary" download={`qr-${data.session.id.slice(0, 5)}.png`} href={qrCodeDataUrl}>
                <Download size={18} />
                Pobierz QR
              </a>
              <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj link uczestnika" value={publicUrl} />
            </div>
          </article>

          <article className="wf-panel-card">
            <h3>Linki do udostępnienia</h3>
            <div className="wf-form-stack" style={{ marginTop: 16 }}>
              <label className="wf-field">
                <span className="wf-field-label">Link uczestnika</span>
                <input className="wf-input" readOnly type="text" value={publicUrl} />
              </label>
              <label className="wf-field">
                <span className="wf-field-label">Link do podglądu</span>
                <input className="wf-input" readOnly type="text" value={liveUrl} />
              </label>
            </div>
          </article>

          <article className="wf-panel-card">
            <h3>Zespół z dostępem</h3>
            <p>Do tej ankiety mają dostęp tylko osoby z Twojego zespołu.</p>
          </article>
        </aside>
      </section>
    </div>
  );
}
