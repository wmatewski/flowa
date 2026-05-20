import { Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { LiveResultsTable } from "@/components/session/live-results-table";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getLiveSessionDataForAccess } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes } from "@/lib/format";
import { buildSessionPublicUrl } from "@/lib/public-session";

const QR_CODE_SIZE_DEFAULT = 352;
const AVG_RING_RADIUS = 49;
const AVG_RING_CIRCUMFERENCE = 2 * Math.PI * AVG_RING_RADIUS;

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
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
  const publicUrl = buildSessionPublicUrl(baseUrl, data.session.id);
  const qrCodeSize = QR_CODE_SIZE_DEFAULT;
  const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 1,
    width: qrCodeSize,
    color: {
      dark: "#1a1c1e",
      light: "#ffffff",
    },
  });
  const averageMinutes = data.overview?.average_minutes ?? null;
  const averagePercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(((averageMinutes ?? 0) / Math.max(data.session.screen_time_limit_minutes, 1)) * 100),
    ),
  );
  const averageRingOffset = AVG_RING_CIRCUMFERENCE - (averagePercent / 100) * AVG_RING_CIRCUMFERENCE;

  return (
    <main className="wf-live-results-page">
      <div className="wf-live-results-shell">
        <header className="wf-live-results-header">
          <p className="wf-live-results-eyebrow">{organization.name}</p>
          <h1 className="wf-live-results-title">Ankieta: {data.session.name}</h1>
          <p className="wf-live-results-subtitle">Zobacz, jak inni korzystają z telefonów.</p>
        </header>

        <section className="wf-live-results-grid" aria-label="Podsumowanie wyników na żywo">
          <article className="wf-live-results-card wf-live-results-join-card">
            <h2 className="wf-live-results-card-title">Dołącz do ankiety</h2>
            <div className="wf-live-results-join-frame">
              <div className="wf-live-results-join-frame-inner">
                <Image
                  alt={`Kod QR dla ${data.session.name}`}
                  className="wf-live-results-join-qr"
                  height={248}
                  src={qrCodeDataUrl}
                  width={248}
                />
              </div>
            </div>
            <p className="wf-live-results-join-caption">Zeskanuj kod, aby wziąć udział z telefonu</p>
          </article>

          <article className="wf-live-results-card wf-live-results-average-card">
            <h2 className="wf-live-results-card-title">Średni czas przed ekranem</h2>
            <div className="wf-live-results-average-body">
              <div className="wf-live-results-average-ring" aria-hidden="true">
                <svg className="wf-live-results-average-ring-svg" viewBox="0 0 132 132">
                  <circle
                    className="wf-live-results-average-ring-track"
                    cx="66"
                    cy="66"
                    r="49"
                  />
                  <circle
                    className="wf-live-results-average-ring-progress"
                    cx="66"
                    cy="66"
                    r="49"
                    style={{ strokeDashoffset: averageRingOffset }}
                  />
                </svg>
                <Smartphone className="wf-live-results-average-icon" size={36} />
              </div>
              <div className="wf-live-results-average-value">{formatMinutes(averageMinutes)}</div>
            </div>
          </article>
        </section>

        <LiveResultsTable refreshUrl={`/api/live/${sessionId}`} initialEntries={data.entries} />

        <footer className="wf-live-results-footer">
          <Link className="wf-live-results-footer-brand" href="/">
            powered by Wojticore Flowa
          </Link>
          <nav className="wf-live-results-footer-links" aria-label="Linki stopki">
            <Link href="#privacy">Prywatność</Link>
            <Link href="#terms">Regulamin</Link>
            <Link href="#help">Pomoc</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
