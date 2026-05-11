import { CalendarRange, Clock3, Plus, Users } from "lucide-react";
import Link from "next/link";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getOrganizationDashboardData } from "@/lib/data";
import {
  formatMembershipRole,
  formatMinutes,
  formatNumber,
  formatPercentage,
  formatRelativeDate,
} from "@/lib/format";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.password === "updated") {
    return { type: "success", message: "Hasło zostało zapisane. Konto jest gotowe do pracy." };
  }

  return null;
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { organization, membership, user } = await getAuthenticatedAdmin();
  const dashboard = await getOrganizationDashboardData({
    organizationId: organization.id,
    membershipId: membership.id,
    role: membership.role,
    userId: user.id,
  });
  const flash = getFlashMessage(params);

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Panel Organizatora</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>
            {organization.name}
          </h1>
          <p className="wf-page-subtitle">
            Śledź aktywność uczestników, średni czas przed ekranem i status sesji w jednym widoku.
          </p>
        </div>

        <Link className="wf-btn wf-btn-primary" href="/admin/sessions/new">
          <Plus size={18} />
          Utwórz nową sesję
        </Link>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <section className="wf-metric-grid" style={{ marginBottom: 24 }}>
        <article className="wf-metric-card">
          <div className="wf-metric-icon">
            <Users size={24} />
          </div>
          <h3>Liczba użytkowników</h3>
          <div className="wf-metric-value">{formatNumber(dashboard.metrics.totalParticipants)}</div>
          <div className="wf-table-muted">
            Aktywni uczestnicy z najnowszych zgłoszeń we wszystkich sesjach.
          </div>
        </article>

        <article className="wf-metric-card">
          <div className="wf-metric-icon">
            <Clock3 size={24} />
          </div>
          <h3>Średni czas przed ekranem</h3>
          <div className="wf-metric-value">{formatMinutes(dashboard.metrics.averageMinutes)}</div>
          <div className="wf-table-muted">
            Zmiana tydzień do tygodnia: {formatPercentage(dashboard.metrics.averageTrend)}
          </div>
        </article>

        <article className="wf-metric-card">
          <div className="wf-metric-icon">
            <CalendarRange size={24} />
          </div>
          <h3>Liczba sesji</h3>
          <div className="wf-metric-value">{formatNumber(dashboard.metrics.totalSessions)}</div>
          <div className="wf-table-muted">
            Zmiana w ostatnich 30 dniach: {formatPercentage(dashboard.metrics.sessionTrend)}
          </div>
        </article>
      </section>

      <section
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.9fr)",
        }}
      >
        <article className="wf-activity-card wf-surface-card">
          <div className="wf-page-header" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.04em" }}>
                Ostatnia aktywność
              </h2>
              <p className="wf-table-muted">Wszystkie najważniejsze zdarzenia w organizacji.</p>
            </div>
          </div>

          <div className="wf-activity-list">
            {dashboard.recentActivities.length ? (
              dashboard.recentActivities.map((activity) => (
                <div className="wf-activity-row" key={activity.id}>
                  <div>
                    <div className="wf-activity-title">{activity.title}</div>
                    <div className="wf-table-muted">
                      {activity.description ?? "Brak dodatkowego opisu."}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="wf-pill">{activity.tag}</div>
                    <div
                      className="wf-table-muted"
                      style={{ justifyContent: "flex-end", marginTop: 8 }}
                    >
                      {formatRelativeDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="wf-empty">Brak aktywności do wyświetlenia.</p>
            )}
          </div>
        </article>

        <div className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card">
            <h3>Najnowsze sesje</h3>
            <div className="wf-activity-list">
              {dashboard.sessions.slice(0, 4).map((session) => (
                <div className="wf-activity-row" key={session.session_id}>
                  <div>
                    <div className="wf-activity-title">{session.name}</div>
                    <div className="wf-table-muted">
                      {formatNumber(session.participant_count)} uczestników •{" "}
                      {formatMinutes(session.average_minutes)}
                    </div>
                  </div>
                  <Link className="wf-link-button" href={`/admin/sessions/${session.session_id}`}>
                    Otwórz
                  </Link>
                </div>
              ))}
            </div>
          </article>

          <article className="wf-panel-card">
            <h3>Zespół organizacji</h3>
            <div className="wf-member-list">
              {dashboard.members.slice(0, 5).map((member) => (
                <div className="wf-member-row" key={member.membershipId}>
                  <div>
                    <div className="wf-member-name">{member.displayName}</div>
                    <div className="wf-table-muted">{member.email}</div>
                  </div>
                  <div className="wf-pill wf-pill-soft">{formatMembershipRole(member.role)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <Link className="wf-btn wf-btn-secondary wf-btn-block" href="/admin/organization">
                Zarządzaj organizacją
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}