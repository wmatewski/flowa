import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { CopyButton } from "@/components/session/copy-button";
import { LiveAverageCard } from "@/components/session/live-average-card";
import { FullscreenButton } from "@/components/session/fullscreen-button";
import { LiveResultsTable } from "@/components/session/live-results-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getClerkOrganizationSummary } from "@/lib/clerk-organizations";
import { getLiveSessionDataById, getLiveSessionDataForAccess } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { resolveLiveSessionAccess } from "@/lib/live-session-access";
import { buildSessionPublicUrl, buildSessionShortCode } from "@/lib/public-session";

const QR_CODE_SIZE_DEFAULT = 352;

const buildRefreshUrl = (sessionId: string, displayToken?: string | null) =>
  `/api/live/${sessionId}${displayToken ? `?display_token=${encodeURIComponent(displayToken)}` : ""}`;

const renderLiveResults = (input: {
  organizationName: string;
  sessionName: string;
  refreshUrl: string;
  qrCodeDataUrl: string;
  averageMinutes: number | null;
  screenTimeLimitMinutes: number;
  entries: Awaited<ReturnType<typeof getLiveSessionDataById>>["entries"];
}) => (
  <main className="wf-live-results-page">
    <FullscreenButton />
    <div className="wf-live-results-shell">
      <header className="wf-live-results-header">
        <p className="wf-live-results-eyebrow">{input.organizationName}</p>
        <h1 className="wf-live-results-title">Ankieta: {input.sessionName}</h1>
        <p className="wf-live-results-subtitle">Zobacz, jak inni korzystają z telefonów.</p>
      </header>

      <section className="wf-live-results-grid" aria-label="Podsumowanie wyników na żywo">
        <article className="wf-live-results-card wf-live-results-join-card">
          <h2 className="wf-live-results-card-title">Dołącz do ankiety</h2>
          <div className="wf-live-results-join-frame">
            <div className="wf-live-results-join-frame-inner">
              <Image
                alt={`Kod QR dla ${input.sessionName}`}
                className="wf-live-results-join-qr"
                height={248}
                src={input.qrCodeDataUrl}
                width={248}
              />
            </div>
          </div>
          <p className="wf-live-results-join-caption">Zeskanuj kod, aby wziąć udział z telefonu</p>
        </article>

        <LiveAverageCard
          initialAverageMinutes={input.averageMinutes}
          refreshUrl={input.refreshUrl}
          screenTimeLimitMinutes={input.screenTimeLimitMinutes}
        />
      </section>

      <LiveResultsTable refreshUrl={input.refreshUrl} initialEntries={input.entries} />

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

export default async function LiveSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const baseUrl = publicEnv.appUrl.replace(/\/$/, "");
  const displayToken = typeof query.display_token === "string" ? query.display_token : null;
  const access = await resolveLiveSessionAccess(sessionId, displayToken);

  if (access?.source === "admin") {
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
    const publicUrl = buildSessionPublicUrl(baseUrl, data.session.id);
    const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: QR_CODE_SIZE_DEFAULT,
      color: {
        dark: "#1a1c1e",
        light: "#ffffff",
      },
    });

    return renderLiveResults({
      organizationName: organization.name,
      sessionName: data.session.name,
      refreshUrl: buildRefreshUrl(sessionId),
      qrCodeDataUrl,
      averageMinutes: data.overview?.average_minutes ?? null,
      screenTimeLimitMinutes: data.session.screen_time_limit_minutes,
      entries: data.entries,
    });
  }

  if (access?.source === "display" && access.tokenPayload) {
    const data = await getLiveSessionDataById(sessionId);
    const organization = await getClerkOrganizationSummary(data.session.organization_id);
    const publicUrl = buildSessionPublicUrl(baseUrl, data.session.id);
    const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: QR_CODE_SIZE_DEFAULT,
      color: {
        dark: "#1a1c1e",
        light: "#ffffff",
      },
    });

    return renderLiveResults({
      organizationName: organization.name,
      sessionName: data.session.name,
      refreshUrl: buildRefreshUrl(sessionId, displayToken),
      qrCodeDataUrl,
      averageMinutes: data.overview?.average_minutes ?? null,
      screenTimeLimitMinutes: data.session.screen_time_limit_minutes,
      entries: data.entries,
    });
  }

  const shortCode = buildSessionShortCode(sessionId);
  const loginLink = `${baseUrl}/link`;

  return (
    <main className="wf-live-results-page">
      <div className="wf-live-results-shell">
        <header className="wf-live-results-header">
          <p className="wf-live-results-eyebrow">Publiczny podgląd</p>
          <h1 className="wf-live-results-title">Kod: {shortCode}</h1>
          <p className="wf-live-results-subtitle">
            Żeby uruchomić widok live, zaloguj się na stronie link i wpisz ten kod prezentacji.
          </p>
        </header>

        <section className="wf-live-results-grid" aria-label="Ekran parowania widoku">
          <article className="wf-live-results-card wf-live-results-join-card">
            <h2 className="wf-live-results-card-title">Kod prezentacji</h2>
            <div className="wf-live-results-join-frame">
              <div className="wf-live-results-join-frame-inner" style={{ padding: 24 }}>
                <div className="wf-code-block" style={{ fontSize: 32, textAlign: "center" }}>
                  {shortCode}
                </div>
              </div>
            </div>
            <p className="wf-live-results-join-caption">Wpisz ten kod na /link po zalogowaniu.</p>
          </article>

          <article className="wf-live-results-card">
            <h2 className="wf-live-results-card-title">Link do logowania</h2>
            <div className="wf-form-stack" style={{ marginTop: 16 }}>
              <label className="wf-field">
                <span className="wf-field-label">Adres</span>
                <Input readOnly type="text" value={loginLink} />
              </label>
            </div>
            <div className="wf-card-actions" style={{ marginTop: 16 }}>
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link" value={loginLink} />
              <Button asChild variant="secondary">
                <Link href="/link">Przejdź do /link</Link>
              </Button>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
