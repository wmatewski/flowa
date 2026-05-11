import { ArrowUpRight, Plus, Settings, Trash2 } from "lucide-react";
import Link from "next/link";

import { deleteSessionAction } from "@/app/admin/actions";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionsListData } from "@/lib/data";
import { formatDate, formatMinutes, formatNumber, formatSessionStatus } from "@/lib/format";
import type { FlashMessage, SessionOverview, SessionStatus } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.deleted === "1") {
    return { type: "success", message: "Sesja została usunięta." };
  }

  if (params.error === "forbidden") {
    return { type: "error", message: "Nie masz dostępu do wybranej ankiety." };
  }

  if (params.error === "missing-session") {
    return { type: "error", message: "Nie wybrano sesji do usunięcia." };
  }

  return null;
};

const getStatusTone = (status: SessionStatus) => {
  if (status === "completed") {
    return "optimal";
  }

  if (status === "draft") {
    return "warning";
  }

  return "critical";
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status =
    params.status === "active" || params.status === "completed" || params.status === "draft"
      ? params.status
      : "all";
  const query = String(params.q ?? "").trim().toLowerCase();
  const flash = getFlashMessage(params);
  const { organization, membership, user } = await getAuthenticatedAdmin();
  const sessions = await getSessionsListData({
    organizationId: organization.id,
    membershipId: membership.id,
    role: membership.role,
    userId: user.id,
  });

  const filteredSessions = sessions.filter((session) => {
    const matchesStatus = status === "all" || session.status === status;
    const matchesQuery =
      !query ||
      session.name.toLowerCase().includes(query) ||
      session.slug.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });
  const totalParticipants = filteredSessions.reduce(
    (sum, session) => sum + (session.participant_count ?? 0),
    0,
  );
  const activeSessions = filteredSessions.filter((session) => session.status === "active").length;
  const draftSessions = filteredSessions.filter((session) => session.status === "draft").length;
  const completedSessions = filteredSessions.filter((session) => session.status === "completed").length;

  const buildFilterHref = (value: string) => {
    const next = new URLSearchParams();

    if (query) {
      next.set("q", query);
    }

    if (value !== "all") {
      next.set("status", value);
    }

    const suffix = next.toString();
    return suffix ? `/admin/sessions?${suffix}` : "/admin/sessions";
  };

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Moje sesje</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>Zarządzaj wszystkimi sesjami</h1>
          <p className="wf-page-subtitle">Twórz, edytuj i monitoruj sesje przypisane do organizacji {organization.name}.</p>
        </div>

        <Link className="wf-btn wf-btn-primary" href="/admin/sessions/new">
          <Plus size={18} />
          Utwórz nową sesję
        </Link>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-hero-preview-grid" style={{ marginBottom: 24 }}>
        <article className="wf-hero-preview-card">
          <span className="wf-table-muted">Widoczne ankiety</span>
          <strong className="wf-metric-value" style={{ fontSize: "2.25rem" }}>
            {formatNumber(filteredSessions.length)}
          </strong>
          <span className="wf-table-muted">Po uprawnieniach i aktywnych filtrach</span>
        </article>
        <article className="wf-hero-preview-card">
          <span className="wf-table-muted">Aktywne</span>
          <strong className="wf-metric-value" style={{ fontSize: "2.25rem" }}>
            {formatNumber(activeSessions)}
          </strong>
          <span className="wf-table-muted">Szkice: {formatNumber(draftSessions)}</span>
        </article>
        <article className="wf-hero-preview-card">
          <span className="wf-table-muted">Uczestnicy</span>
          <strong className="wf-metric-value" style={{ fontSize: "2.25rem" }}>
            {formatNumber(totalParticipants)}
          </strong>
          <span className="wf-table-muted">Zakończone ankiety: {formatNumber(completedSessions)}</span>
        </article>
      </div>

      <form className="wf-search-row" method="get">
        <input className="wf-search-input" defaultValue={String(params.q ?? "")} name="q" placeholder="Szukaj sesji..." />
        {status !== "all" ? <input name="status" type="hidden" value={status} /> : null}
        <button className="wf-btn wf-btn-secondary" type="submit">
          Szukaj
        </button>
      </form>

      <div className="wf-filter-row" style={{ margin: "18px 0 26px" }}>
        {["all", "active", "completed", "draft"].map((candidate) => (
          <Link
            className={`wf-filter-link${status === candidate ? " is-active" : ""}`}
            href={buildFilterHref(candidate)}
            key={candidate}
          >
            {candidate === "all" ? "Wszystkie" : formatSessionStatus(candidate)}
          </Link>
        ))}
      </div>

      <div className="wf-sessions-table-shell">
        {filteredSessions.length ? (
          <table className="wf-sessions-table">
            <thead>
              <tr>
                <th>Nazwa ankiety</th>
                <th>Status</th>
                <th>Utworzono</th>
                <th>Uczestnicy</th>
                <th>Średni wynik</th>
                <th>Limit</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session: SessionOverview) => (
                <tr key={session.session_id}>
                  <td>
                    <div className="wf-sessions-name">
                      <Link className="wf-sessions-name-link" href={`/admin/sessions/${session.session_id}`}>
                        {session.name}
                      </Link>
                      <span className="wf-sessions-subtitle">/{session.slug}</span>
                    </div>
                  </td>
                  <td>
                    <div className={`wf-status-chip ${getStatusTone(session.status)}`}>{formatSessionStatus(session.status)}</div>
                  </td>
                  <td>{formatDate(session.created_at)}</td>
                  <td>{formatNumber(session.participant_count)}</td>
                  <td>{formatMinutes(session.average_minutes)}</td>
                  <td>{formatMinutes(session.screen_time_limit_minutes)}</td>
                  <td>
                    <div className="wf-sessions-actions">
                      <Link className="wf-sessions-open-link" href={`/admin/sessions/${session.session_id}`}>
                        Otwórz
                        <ArrowUpRight size={16} />
                      </Link>
                      <Link aria-label={`Ustawienia dla ${session.name}`} className="wf-icon-button" href={`/admin/sessions/${session.session_id}/settings`}>
                        <Settings size={18} />
                      </Link>
                      <form action={deleteSessionAction}>
                        <input name="sessionId" type="hidden" value={session.session_id} />
                        <button aria-label={`Usuń ${session.name}`} className="wf-icon-button danger" type="submit">
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="wf-panel-card">
            <p className="wf-empty">Brak sesji spełniających podane kryteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}