import { QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { CopyButton } from "@/components/session/copy-button";
import { LiveResultsTable } from "@/components/session/live-results-table";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getLiveSessionDataForAccess } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { buildSessionPublicUrl, buildSessionShortPath } from "@/lib/public-session";

const QR_CODE_SIZE_DEFAULT = 352;
const QR_CODE_SIZE_EMBED = 260;

export default async function LiveSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const embed = query.embed === "1";
  const { organization, membership, user } = await getAuthenticatedAdmin();

  const data = await getLiveSessionDataForAccess(
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
  const publicUrl = buildSessionPublicUrl(baseUrl, data.session.id);
  const qrCodeSize = embed ? QR_CODE_SIZE_EMBED : QR_CODE_SIZE_DEFAULT;
  const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 1,
    width: qrCodeSize,
    color: {
      dark: "#1a1c1e",
      light: "#ffffff",
    },
  });

  return (
    <main className={`wf-live-page${embed ? " is-embed" : ""}`}>
      <div className="wf-live-page-shell">
        <header className="wf-live-page-header">
          <div>
            <div className="wf-badge">Wyniki na żywo</div>
            <h1 className="wf-page-title" style={{ marginTop: 16 }}>{data.session.name}</h1>
            {!embed ? (
              <p className="wf-page-subtitle">
                Widok prezentacyjny z automatycznym odświeżaniem wyników.
              </p>
            ) : null}
          </div>

          <div className="wf-live-header-right">
            <div className="wf-live-header-qr">
              <Image
                alt={`Kod QR dla ${data.session.name}`}
                className="wf-qr-image wf-live-header-qr-image"
                height={embed ? 120 : 152}
                src={qrCodeDataUrl}
                width={embed ? 120 : 152}
              />
              <span className="wf-live-header-qr-label">
                <QrCode size={12} />
                Zeskanuj
              </span>
            </div>

            {!embed ? (
              <div className="wf-card-actions">
                <Link className="wf-btn wf-btn-secondary" href={buildSessionShortPath(data.session.id)}>
                  Otwórz ankietę
                </Link>
                <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj link live" value={liveUrl} />
              </div>
            ) : null}
          </div>
        </header>

        <LiveResultsTable
          embed={embed}
          initialAverageMinutes={data.overview?.average_minutes ?? null}
          initialEntries={data.entries}
          initialParticipantCount={data.overview?.participant_count ?? data.entries.length}
          refreshUrl={`/api/live/${sessionId}`}
        />

        {!embed ? (
          <div className="wf-live-banner">
            <div>
              <strong>Embed do prezentacji</strong>
              <p className="wf-table-muted" style={{ marginTop: 6 }}>
                Użyj tego linku w iframe albo wyświetl go bezpośrednio na drugim ekranie.
              </p>
            </div>
            <CopyButton
              className="wf-btn wf-btn-secondary"
              label="Kopiuj URL embed"
              value={`${liveUrl}?embed=1`}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
