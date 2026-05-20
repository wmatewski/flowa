import { QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { CopyButton } from "@/components/session/copy-button";
import { LiveResultsTable } from "@/components/session/live-results-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card className="wf-live-page-header">
          <CardHeader className="items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3">
              <Badge variant="secondary">Na żywo</Badge>
              <CardTitle className="wf-page-title" style={{ margin: 0 }}>{data.session.name}</CardTitle>
              <CardDescription>
                {embed ? "Widok osadzony do prezentacji." : "Udostępnij ekran z wynikami bez przeładowań."}
              </CardDescription>
            </div>

            <div className="wf-live-header-right">
              <div className="wf-live-header-qr">
                <Image
                  alt={`Kod QR dla ${data.session.name}`}
                  className="wf-qr-image wf-live-header-qr-image"
                  height={embed ? 120 : 168}
                  src={qrCodeDataUrl}
                  width={embed ? 120 : 168}
                />
                <span className="wf-live-header-qr-label">
                  <QrCode size={12} />
                  Zeskanuj
                </span>
              </div>

              {!embed ? (
                <div className="wf-card-actions">
                  <Button asChild variant="secondary">
                    <Link href={buildSessionShortPath(data.session.id)}>Otwórz ankietę</Link>
                  </Button>
                  <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj link live" value={liveUrl} />
                </div>
              ) : null}
            </div>
          </CardHeader>
        </Card>

        <LiveResultsTable
          embed={embed}
          initialAverageMinutes={data.overview?.average_minutes ?? null}
          initialEntries={data.entries}
          initialParticipantCount={data.overview?.participant_count ?? data.entries.length}
          refreshUrl={`/api/live/${sessionId}`}
        />

        {!embed ? (
          <Card className="wf-live-banner">
            <div>
              <CardTitle style={{ margin: 0 }}>Embed do prezentacji</CardTitle>
              <CardDescription>
                Użyj tego linku w iframe albo wyświetl go bezpośrednio na drugim ekranie.
              </CardDescription>
            </div>
            <CopyButton
              className="wf-btn wf-btn-secondary"
              label="Kopiuj URL embed"
              value={`${liveUrl}?embed=1`}
            />
          </Card>
        ) : null}
      </div>
    </main>
  );
}
