import { Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import type { CSSProperties } from "react";

import { CopyButton } from "@/components/session/copy-button";
import { LiveResultsTable } from "@/components/session/live-results-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getLiveSessionDataForAccess } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes } from "@/lib/format";
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
  const averageMinutes = data.overview?.average_minutes ?? null;
  const averagePercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(((averageMinutes ?? 0) / Math.max(data.session.screen_time_limit_minutes, 1)) * 100),
    ),
  );
  const participantCount = data.overview?.participant_count ?? data.entries.length;
  const iframeCode = `<iframe src="${liveUrl}?embed=1" title="${data.session.name} - widok na żywo" width="1280" height="720" style="border:0;width:100%;height:100%"></iframe>`;

  return (
    <main className={`wf-live-page${embed ? " is-embed" : ""}`}>
      <div className="wf-live-page-shell">
        <header className="wf-live-hero">
          <div className="wf-live-hero-copy">
            <Badge variant="secondary">{organization.name}</Badge>
            <h1 className="wf-live-hero-title">Ankieta: {data.session.name}</h1>
            <p className="wf-live-hero-subtitle">
              Widok na żywo z prawdziwymi danymi sesji, odświeżaniem realtime i publicznym kodem do dołączenia z telefonu.
            </p>
          </div>

          {!embed ? (
            <div className="wf-live-hero-actions">
              <Button asChild variant="secondary">
                <Link href={buildSessionShortPath(data.session.id)}>Otwórz ankietę</Link>
              </Button>
              <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj link live" value={liveUrl} />
            </div>
          ) : null}
        </header>

        <section className="wf-live-feature-grid">
          <Card className="wf-live-join-card">
            <CardHeader>
              <CardTitle>Dołącz do ankiety</CardTitle>
              <CardDescription>Zeskanuj kod, aby wziąć udział z telefonu.</CardDescription>
            </CardHeader>
            <CardContent className="wf-live-join-content">
              <div className="wf-live-join-qr">
                <Image
                  alt={`Kod QR dla ${data.session.name}`}
                  className="wf-qr-image wf-live-join-qr-image"
                  height={embed ? 196 : 248}
                  src={qrCodeDataUrl}
                  width={embed ? 196 : 248}
                />
              </div>
              <p className="wf-live-join-caption">Zeskanuj kod, aby wziąć udział z telefonu.</p>
            </CardContent>
          </Card>

          <Card className="wf-live-average-card">
            <CardHeader>
              <CardTitle>Średni czas przed ekranem</CardTitle>
              <CardDescription>Średnia z całej sesji, odświeżana automatycznie.</CardDescription>
            </CardHeader>
            <CardContent className="wf-live-average-content">
              <div
                className="wf-live-average-ring"
                style={{ ["--score" as const]: averagePercent } as CSSProperties}
              >
                <Smartphone className="wf-live-average-icon" size={38} />
              </div>
              <div className="wf-live-average-value">{formatMinutes(averageMinutes)}</div>
              <p className="wf-live-average-caption">{participantCount} odpowiedzi w sesji</p>
            </CardContent>
          </Card>
        </section>

        <LiveResultsTable
          initialEntries={data.entries}
          refreshUrl={`/api/live/${sessionId}`}
        />

        {!embed ? (
          <section className="wf-live-links-grid">
            <Card className="wf-live-links-card">
              <CardHeader>
                <CardTitle>Link uczestnika</CardTitle>
                <CardDescription>Publiczny adres dla uczestników ankiety.</CardDescription>
              </CardHeader>
              <CardContent>
                <input className="wf-input" readOnly type="text" value={publicUrl} />
              </CardContent>
            </Card>

            <Card className="wf-live-links-card">
              <CardHeader>
                <CardTitle>Kod do osadzenia</CardTitle>
                <CardDescription>Użyj go w prezentacji, bez dodatkowych przeładowań.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="wf-textarea wf-code-block"
                  readOnly
                  rows={6}
                  style={{ minHeight: 176 }}
                  value={iframeCode}
                />
                <div className="wf-card-actions">
                  <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link" value={publicUrl} />
                  <CopyButton
                    className="wf-btn wf-btn-primary"
                    label="Kopiuj iframe"
                    value={iframeCode}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <footer className="wf-live-footer">
          <div className="wf-live-footer-brand">
            <span>powered by Wojticore Flowa</span>
          </div>
          <nav className="wf-live-footer-links">
            <Link href="/guides">Pomoc</Link>
            <span>Prywatność</span>
            <span>Regulamin</span>
          </nav>
        </footer>
      </div>
    </main>
  );
}
