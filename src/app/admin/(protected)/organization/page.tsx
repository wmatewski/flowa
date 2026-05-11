import Link from "next/link";
import { redirect } from "next/navigation";

import { inviteAdminAction } from "@/app/admin/actions";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getOrganizationMembersData } from "@/lib/data";
import {
  formatMembershipRole,
  formatMembershipStatus,
  formatNumber,
  formatSessionStatus,
} from "@/lib/format";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.invite === "sent") {
    return { type: "success", message: "Współtwórca został dodany do organizacji." };
  }

  if (params.error === "missing-email") {
    return { type: "error", message: "Podaj adres e-mail współtwórcy." };
  }

  if (params.error === "forbidden") {
    return { type: "error", message: "Moderator nie może zarządzać zaproszeniami w organizacji." };
  }

  if (params.error === "invite-failed") {
    return { type: "error", message: "Nie udało się wysłać lub przypisać zaproszenia." };
  }

  return null;
};

export default async function OrganizationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedSessionId = typeof params.sessionId === "string" ? params.sessionId : undefined;
  const { organization, membership, user } = await getAuthenticatedAdmin();

  if (membership.role === "moderator") {
    redirect("/admin/sessions?error=forbidden");
  }

  const data = await getOrganizationMembersData(
    {
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
    selectedSessionId,
  );
  const flash = getFlashMessage(params);

  const buildSessionHref = (sessionId?: string) => {
    if (!sessionId) {
      return "/admin/organization";
    }

    return `/admin/organization?sessionId=${sessionId}`;
  };

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Organizacja</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>{organization.name}</h1>
          <p className="wf-page-subtitle">Dodawaj członków do organizacji i zarządzaj dostępem przez Clerk.</p>
        </div>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-filter-row" style={{ marginBottom: 24 }}>
        <Link className={`wf-filter-link${!data.currentSession ? " is-active" : ""}`} href={buildSessionHref()}>
          Wszystkie sesje
        </Link>
        {data.sessions.map((session) => (
          <Link
            className={`wf-filter-link${data.currentSession?.session_id === session.session_id ? " is-active" : ""}`}
            href={buildSessionHref(session.session_id)}
            key={session.session_id}
          >
            {session.name}
          </Link>
        ))}
      </div>

      <section style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.95fr)" }}>
        <article className="wf-table-card">
          <div className="wf-page-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Członkowie organizacji</h3>
              <p className="wf-table-muted">{formatNumber(data.members.length)} aktywnych i zaproszonych kont.</p>
            </div>
          </div>

          <div className="wf-table-head" style={{ gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr" }}>
            <span>Osoba</span>
            <span>E-mail</span>
            <span>Rola</span>
            <span>Status</span>
          </div>

          <div>
            {data.members.map((member) => (
              <div
                className="wf-table-row"
                key={member.membershipId}
                style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr", gap: 16 }}
              >
                <div>
                  <div className="wf-member-name">{member.displayName}</div>
                </div>
                <div>{member.email}</div>
                <div>{formatMembershipRole(member.role)}</div>
                <div>{formatMembershipStatus(member.status)}</div>
              </div>
            ))}
          </div>
        </article>

        <div className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card">
            <h3>Dodaj współtwórcę</h3>
            <p style={{ marginBottom: 18 }}>
              Zaproszenia i członkostwo obsługuje Clerk, a dostęp do ankiet wynika z organizacji.
            </p>
            <form action={inviteAdminAction} className="wf-form-stack">
              <label className="wf-field">
                <span className="wf-field-label">E-mail</span>
                <input className="wf-input" name="email" placeholder="adres@email.com" type="email" />
              </label>
              <label className="wf-field">
                <span className="wf-field-label">Rola</span>
                <select className="wf-select" defaultValue="moderator" name="role">
                  <option value="moderator">Moderator</option>
                  <option value="admin">Administrator</option>
                  <option value="owner">Właściciel</option>
                </select>
              </label>
              {data.currentSession ? <input name="sessionId" type="hidden" value={data.currentSession.session_id} /> : null}
              <button className="wf-btn wf-btn-primary wf-btn-block" type="submit">
                Wyślij Zaproszenie
              </button>
            </form>
          </article>

          <article className="wf-panel-card">
            <h3>Aktywna ankieta</h3>
            {data.currentSession ? (
              <>
                <div className="wf-member-list">
                  <div className="wf-member-row">
                    <span>Nazwa</span>
                    <strong>{data.currentSession.name}</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>Status</span>
                    <strong>{formatSessionStatus(data.currentSession.status)}</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>Uczestnicy</span>
                    <strong>{formatNumber(data.currentSession.participant_count)}</strong>
                  </div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ marginTop: 0 }}>Dostęp organizacji</h3>
                  <p className="wf-empty">Wszyscy członkowie organizacji Clerk mają dostęp do ankiet w tej przestrzeni.</p>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Link className="wf-btn wf-btn-secondary wf-btn-block" href={`/admin/sessions/${data.currentSession.session_id}/settings`}>
                    Edytuj ustawienia sesji
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <p className="wf-empty">Nie ma jeszcze żadnej sesji. Utwórz ją, aby przypisywać współtwórców do konkretnego wydarzenia.</p>
                <div style={{ marginTop: 16 }}>
                  <Link className="wf-btn wf-btn-secondary wf-btn-block" href="/admin/sessions/new">
                    Utwórz pierwszą sesję
                  </Link>
                </div>
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}