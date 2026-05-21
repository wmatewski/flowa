import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Globe2,
  MapPin,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  authorizeLiveDisplayRequestAction,
  lookupLiveDisplayRequestAction,
} from "@/app/link/actions";
import { LinkCodeForm } from "@/components/link/link-code-form";
import { getClerkOrganizationSummary } from "@/lib/clerk-organizations";
import { getLiveDisplayRequestById } from "@/lib/live-display-request";
import { getSessionById } from "@/lib/public-session";
import { getAccessibleSession, normalizeMembershipRole } from "@/lib/session-access";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.error === "missing-code") {
    return { type: "error", message: "Wpisz pelny 6-cyfrowy kod autoryzacji." };
  }

  if (params.error === "invalid-code") {
    return { type: "error", message: "Ten kod wygasl albo nie istnieje." };
  }

  if (params.error === "forbidden") {
    return { type: "error", message: "Nie masz uprawnien do tej prezentacji." };
  }

  if (params.error === "not-authorized") {
    return { type: "error", message: "To konto nie ma aktywnej organizacji do autoryzacji live." };
  }

  if (params.error === "invalid-request") {
    return { type: "error", message: "To zadanie autoryzacji jest juz nieaktywne." };
  }

  return null;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const LinkPageShell = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="wf-link-app-shell">
    <header className="wf-link-topbar">
      <div className="wf-link-topbar-brand">Wojticore Flowa</div>
    </header>

    <main className="wf-link-main">{children}</main>

    <footer className="wf-link-footer">
      <div className="wf-link-footer-copy">© 2026 Wojticore Flowa. Analytical & Transparent.</div>
      <nav className="wf-link-footer-links" aria-label="Linki stopki">
        <Link href="#">Privacy</Link>
        <Link href="#">Terms</Link>
        <Link href="#">API Status</Link>
      </nav>
    </footer>
  </div>
);

export default async function LiveLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    redirect("/auth?redirect_url=/link");
  }

  if (!orgId) {
    redirect("/auth?redirect_url=/link");
  }

  const requestId = typeof query.request === "string" ? query.request : null;
  const authorizedId = typeof query.authorized === "string" ? query.authorized : null;
  const currentRequestId = authorizedId ?? requestId;
  const liveRequest = currentRequestId ? await getLiveDisplayRequestById(currentRequestId) : null;
  const flash = getFlashMessage(query);

  if (currentRequestId && !liveRequest) {
    redirect("/link?error=invalid-request");
  }

  if (liveRequest) {
    const accessibleSession = await getAccessibleSession(
      {
        organizationId: orgId,
        role: normalizeMembershipRole(orgRole),
        userId,
      },
      liveRequest.session_id,
    );

    if (!accessibleSession) {
      redirect("/link?error=forbidden");
    }
  }

  if (requestId && liveRequest && liveRequest.status === "pending") {
    const session = await getSessionById(liveRequest.session_id);

    if (!session) {
      redirect("/link?error=invalid-request");
    }

    const organization = await getClerkOrganizationSummary(session.organization_id);

    return (
      <LinkPageShell>
        <section className="wf-link-card-shell">
          <article className="wf-link-verification-card">
            <div className="wf-link-hero-icon">
              <ShieldCheck size={34} />
            </div>

            <h1 className="wf-link-card-title">Potwierdz logowanie</h1>
            <p className="wf-link-card-subtitle">Upewnij sie, ze to Ty probujesz uruchomic widok live.</p>

            <div className="wf-link-presentation-summary">
              <div className="wf-link-presentation-label">Prezentacja</div>
              <div className="wf-link-presentation-title">{session.name}</div>
              <div className="wf-link-presentation-subtitle">{organization.name}</div>
            </div>

            <div className="wf-link-details-list">
              <div className="wf-link-details-row">
                <span className="wf-link-details-label">Godzina</span>
                <div className="wf-link-details-value">
                  <Clock3 size={16} />
                  <span>{formatDateTime(liveRequest.requested_at)}</span>
                </div>
              </div>

              <div className="wf-link-details-row">
                <span className="wf-link-details-label">Miejsce</span>
                <div className="wf-link-details-value">
                  <MapPin size={16} />
                  <span>{liveRequest.approximate_location ?? "Nieznane przyblizone miejsce"}</span>
                </div>
              </div>

              <div className="wf-link-details-row">
                <span className="wf-link-details-label">Adres IP</span>
                <div className="wf-link-details-value">
                  <Globe2 size={16} />
                  <span className="wf-link-mono">{liveRequest.requested_ip ?? "Brak danych"}</span>
                </div>
              </div>

              <div className="wf-link-details-row wf-link-details-row-last">
                <span className="wf-link-details-label">Urzadzenie</span>
                <div className="wf-link-details-value">
                  <MonitorSmartphone size={16} />
                  <span>{liveRequest.device_label ?? "Nieznane urzadzenie"}</span>
                </div>
              </div>
            </div>

            <form action={authorizeLiveDisplayRequestAction} className="wf-link-actions-stack">
              <input name="requestId" type="hidden" value={liveRequest.id} />
              <button className="wf-link-primary-button" type="submit">
                <CheckCircle2 size={18} />
                Autoryzuj
              </button>
            </form>

            <Link className="wf-link-secondary-button" href="/link">
              Anuluj
            </Link>
          </article>
        </section>
      </LinkPageShell>
    );
  }

  if (currentRequestId && liveRequest && liveRequest.status === "authorized") {
    const session = await getSessionById(liveRequest.session_id);

    if (!session) {
      redirect("/link?error=invalid-request");
    }

    return (
      <LinkPageShell>
        <section className="wf-link-state-shell wf-link-state-shell-success">
          <div className="wf-link-success-orb">
            <CheckCircle2 size={82} strokeWidth={1.8} />
          </div>

          <h1 className="wf-link-success-title">Autoryzacja zakończona pomyślnie</h1>
          <p className="wf-link-success-subtitle">
            Sesja live dla prezentacji {session.name} jest już aktywna.
          </p>

          <div className="wf-link-presentation-summary">
            <div className="wf-link-presentation-label">Prezentacja</div>
            <div className="wf-link-presentation-title">{session.name}</div>
            <div className="wf-link-presentation-subtitle">{liveRequest.session_id}</div>
          </div>

          <div className="wf-link-success-actions">
            <Link
              className="wf-link-primary-button wf-link-primary-link"
              href={`/live/${liveRequest.session_id}?request=${liveRequest.id}`}
            >
              Otwórz live
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </LinkPageShell>
    );
  }

  if (authorizedId || requestId) {
    redirect("/link?error=invalid-request");
  }

  return (
    <LinkPageShell>
      <section className="wf-link-card-shell">
        <article className="wf-link-entry-card">
          <div className="wf-link-hero-icon">
            <MonitorSmartphone size={34} />
          </div>

          <h1 className="wf-link-card-title">Autoryzacja urzadzenia</h1>
          <p className="wf-link-card-subtitle">Wpisz kod wyswietlony na ekranie glownym prezentacji</p>

          {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

          <form action={lookupLiveDisplayRequestAction} className="wf-link-entry-form">
            <LinkCodeForm actionLabel="Dalej" />
          </form>
        </article>
      </section>
    </LinkPageShell>
  );
}
