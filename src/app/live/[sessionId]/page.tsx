import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { notFound } from "next/navigation";

import { LiveAuthorizationScreen } from "@/components/live/live-authorization-screen";
import { LivePageAutoRefresh } from "@/components/live/live-page-auto-refresh";
import { LiveAverageCard } from "@/components/session/live-average-card";
import { FullscreenButton } from "@/components/session/fullscreen-button";
import { LiveResultsTable } from "@/components/session/live-results-table";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getClerkOrganizationSummary } from "@/lib/clerk-organizations";
import { getLiveSessionDataById, getLiveSessionDataForAccess } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import {
  createLiveDisplayRequest,
  expireStaleLiveDisplayRequests,
  getLiveDisplayRequestById,
} from "@/lib/live-display-request";
import { buildSessionPublicUrl, getSessionById } from "@/lib/public-session";
import { getApproximateLocation, getClientIp } from "@/lib/request";
import { getAccessibleSession, normalizeMembershipRole } from "@/lib/session-access";
import { createSessionId } from "@/lib/session";
import { detectOperatingSystem, getOperatingSystemConfig } from "@/lib/os";

const QR_CODE_SIZE_DEFAULT = 352;

const renderLiveResults = async (input: {
  sessionId: string;
  organizationName: string;
  sessionName: string;
  publicUrl: string;
  averageMinutes: number | null;
  screenTimeLimitMinutes: number;
  entries: Awaited<ReturnType<typeof getLiveSessionDataById>>["entries"];
}) => {
  const qrCodeDataUrl = await QRCode.toDataURL(input.publicUrl, {
    margin: 1,
    width: QR_CODE_SIZE_DEFAULT,
    color: {
      dark: "#1a1c1e",
      light: "#ffffff",
    },
  });

  return (
    <main className="wf-live-results-page">
      <LivePageAutoRefresh />
      <FullscreenButton />
      <div className="wf-live-results-shell">
        <header className="wf-live-results-header">
          <p className="wf-live-results-eyebrow">{input.organizationName}</p>
          <h1 className="wf-live-results-title">Ankieta: {input.sessionName}</h1>
          <p className="wf-live-results-subtitle">Zobacz, jak inni korzystaja z telefonow.</p>
        </header>

        <section className="wf-live-results-grid" aria-label="Podsumowanie wynikow na zywo">
          <article className="wf-live-results-card wf-live-results-join-card">
            <h2 className="wf-live-results-card-title">Dolacz do ankiety</h2>
            <div className="wf-live-results-join-frame">
              <div className="wf-live-results-join-frame-inner">
                <Image
                  alt={`Kod QR dla ${input.sessionName}`}
                  className="wf-live-results-join-qr"
                  height={248}
                  src={qrCodeDataUrl}
                  width={248}
                />
              </div>
            </div>
            <p className="wf-live-results-join-caption">Zeskanuj kod, aby wziac udzial z telefonu</p>
          </article>

          <LiveAverageCard
            initialAverageMinutes={input.averageMinutes}
            refreshUrl={`/api/live/${input.sessionId}`}
            screenTimeLimitMinutes={input.screenTimeLimitMinutes}
          />
        </section>

        <LiveResultsTable refreshUrl={`/api/live/${input.sessionId}`} initialEntries={input.entries} />

        <footer className="wf-live-results-footer">
          <Link className="wf-live-results-footer-brand" href="/">
            powered by Wojticore Flowa
          </Link>
          <nav className="wf-live-results-footer-links" aria-label="Linki stopki">
            <Link href="#privacy">Prywatnosc</Link>
            <Link href="#terms">Regulamin</Link>
            <Link href="#help">Pomoc</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
};

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
  const { userId, orgId, orgRole } = await auth();

  if (userId && orgId) {
    const accessibleSession = await getAccessibleSession(
      {
        organizationId: orgId,
        role: normalizeMembershipRole(orgRole),
        userId,
      },
      sessionId,
    );

    if (accessibleSession) {
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

      return renderLiveResults({
        sessionId,
        organizationName: organization.name,
        sessionName: data.session.name,
        publicUrl: buildSessionPublicUrl(baseUrl, data.session.id),
        averageMinutes: data.overview?.average_minutes ?? null,
        screenTimeLimitMinutes: data.session.screen_time_limit_minutes,
        entries: data.entries,
      });
    }
  }

  const session = await getSessionById(sessionId);

  if (!session) {
    notFound();
  }

  await expireStaleLiveDisplayRequests();

  const requestId = typeof query.request === "string" ? query.request.trim() : "";
  const existingRequest = requestId ? await getLiveDisplayRequestById(requestId) : null;

  if (existingRequest && existingRequest.session_id === sessionId && existingRequest.status === "authorized") {
    const data = await getLiveSessionDataById(sessionId);
    const organization = await getClerkOrganizationSummary(data.session.organization_id);

    return renderLiveResults({
      sessionId,
      organizationName: organization.name,
      sessionName: data.session.name,
      publicUrl: buildSessionPublicUrl(baseUrl, data.session.id),
      averageMinutes: data.overview?.average_minutes ?? null,
      screenTimeLimitMinutes: data.session.screen_time_limit_minutes,
      entries: data.entries,
    });
  }

  let pendingRequest =
    existingRequest &&
    existingRequest.session_id === sessionId &&
    existingRequest.status !== "expired" &&
    existingRequest.status !== "revoked"
      ? existingRequest
      : null;

  if (!pendingRequest) {
    const headerStore = await headers();
    const userAgent = headerStore.get("user-agent");
    const detectedOperatingSystem = detectOperatingSystem(userAgent);

    pendingRequest = await createLiveDisplayRequest({
      sessionId,
      viewerKey: createSessionId(),
      deviceLabel: getOperatingSystemConfig(detectedOperatingSystem).shortLabel,
      requestedIp: getClientIp(headerStore),
      approximateLocation: getApproximateLocation(headerStore),
      requestUserAgent: userAgent,
    });
  }

  return (
    <LiveAuthorizationScreen
      initialRequest={
        pendingRequest
          ? {
              requestId: pendingRequest.id,
              authorizationCode: pendingRequest.authorization_code,
              status: pendingRequest.status === "authorized" ? "authorized" : "pending",
            }
          : null
      }
      sessionId={sessionId}
    />
  );
}
