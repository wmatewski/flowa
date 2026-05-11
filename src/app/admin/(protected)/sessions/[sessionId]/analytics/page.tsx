import type { CSSProperties } from "react";

import Link from "next/link";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionStatisticsData } from "@/lib/data";
import { formatDateTime, formatMinutes, formatNumber } from "@/lib/format";

export default async function SessionAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const { organization, membership, user } = await getAuthenticatedAdmin();
  const data = await getSessionStatisticsData(
    {
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
    sessionId,
  );
  const participantQuery = String(query.q ?? "").trim().toLowerCase();
  const participants = data.participants.filter((participant) => {
    if (!participantQuery) {
      return true;
    }

    return (
      participant.label.toLowerCase().includes(participantQuery) ||
      participant.age.toString().includes(participantQuery)
    );
  });
  const maxBarValue = Math.max(...data.ageStatistics.map((stat) => stat.average_minutes ?? 0), 1);
  const maxParticipantTime = data.participants[0]?.screenTimeMinutes ?? 0;

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Analityka ankiety</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>{data.session.name}</h1>
          <p className="wf-page-subtitle">Szczegółowa analiza czasu przed ekranem, wieku i poziomu skupienia respondentów.</p>
        </div>

        <div className="wf-card-actions">
          <Link className="wf-btn wf-btn-secondary" href={`/admin/sessions/${sessionId}/live`}>
            Otwórz live
          </Link>
          <Link className="wf-btn wf-btn-primary" href={`/admin/sessions/${sessionId}/settings`}>
            Edytuj sesję
          </Link>
        </div>
      </div>

      <section className="wf-metric-grid" style={{ marginBottom: 24 }}>
        <article className="wf-metric-card">
          <h3>Liczba uczestników</h3>
          <div className="wf-metric-value">{formatNumber(data.overview?.participant_count ?? data.participants.length)}</div>
        </article>
        <article className="wf-metric-card">
          <h3>Średni czas</h3>
          <div className="wf-metric-value">{formatMinutes(data.overview?.average_minutes)}</div>
        </article>
        <article className="wf-metric-card">
          <h3>Maksymalny wynik</h3>
          <div className="wf-metric-value">{formatMinutes(maxParticipantTime)}</div>
        </article>
      </section>

      <section className="wf-stats-grid" style={{ marginBottom: 24 }}>
        <article className="wf-chart-card wf-surface-card">
          <h3>Średni czas dla grup wiekowych</h3>
          <div className="wf-bars" style={{ marginTop: 28 }}>
            {data.ageStatistics.length ? (
              data.ageStatistics.map((stat) => (
                <div className="wf-bar-col" key={stat.age_bucket}>
                  <div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 700 }}>
                    {formatMinutes(stat.average_minutes)}
                  </div>
                  <div
                    className="wf-bar"
                    style={{ height: `${Math.max(((stat.average_minutes ?? 0) / maxBarValue) * 180, 12)}px` }}
                  />
                  <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>{stat.age_bucket}</div>
                </div>
              ))
            ) : (
              <p className="wf-empty">Brak danych do wyświetlenia.</p>
            )}
          </div>
        </article>

        <article className="wf-donut-card wf-surface-card">
          <h3>Poziom skupienia</h3>
          <div className="wf-donut" style={{ ["--score" as const]: data.focusScore.score } as CSSProperties} />
          <div className="wf-donut-content">
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em" }}>{data.focusScore.score}</div>
            <div className="wf-table-muted" style={{ justifyContent: "center" }}>{data.focusScore.label}</div>
          </div>
          <div className="wf-member-list" style={{ marginTop: 12 }}>
            <div className="wf-member-row">
              <span>Zbalansowani</span>
              <strong>{data.focusScore.balancedPercentage}%</strong>
            </div>
            <div className="wf-member-row">
              <span>Podwyższeni</span>
              <strong>{data.focusScore.elevatedPercentage}%</strong>
            </div>
            <div className="wf-member-row">
              <span>Krytyczni</span>
              <strong>{data.focusScore.criticalPercentage}%</strong>
            </div>
          </div>
        </article>
      </section>

      <section style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.8fr)" }}>
        <article className="wf-table-card">
          <div className="wf-page-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Uczestnicy</h3>
              <p className="wf-table-muted">Lista wyników i możliwość szybkiego filtrowania odpowiedzi.</p>
            </div>
          </div>

          <form className="wf-search-row" method="get" style={{ marginBottom: 20 }}>
            <input className="wf-search-input" defaultValue={String(query.q ?? "")} name="q" placeholder="Szukaj uczestnika..." />
            <button className="wf-btn wf-btn-secondary" type="submit">
              Szukaj
            </button>
          </form>

          <div className="wf-table-head" style={{ gridTemplateColumns: "1.2fr 0.4fr 0.7fr 0.8fr 0.9fr" }}>
            <span>Uczestnik</span>
            <span>Wiek</span>
            <span>Czas</span>
            <span>Status</span>
            <span>Przesłano</span>
          </div>

          <div>
            {participants.length ? (
              participants.map((participant) => (
                <div
                  className="wf-table-row"
                  key={participant.id}
                  style={{ display: "grid", gridTemplateColumns: "1.2fr 0.4fr 0.7fr 0.8fr 0.9fr", gap: 16 }}
                >
                  <div>{participant.label}</div>
                  <div>{participant.age}</div>
                  <div>{formatMinutes(participant.screenTimeMinutes)}</div>
                  <div>
                    <span className={`wf-status-chip ${participant.statusTone}`}>{participant.statusLabel}</span>
                  </div>
                  <div>{formatDateTime(participant.submittedAt)}</div>
                </div>
              ))
            ) : (
              <p className="wf-empty" style={{ marginTop: 20 }}>Brak uczestników dla podanego filtra.</p>
            )}
          </div>
        </article>

        <aside className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card">
            <h3>Współtwórcy sesji</h3>
            {data.collaborators.length ? (
              <div className="wf-member-list">
                {data.collaborators.map((member) => (
                  <div className="wf-member-row" key={member.membershipId}>
                    <div>
                      <div className="wf-member-name">{member.displayName}</div>
                      <div className="wf-table-muted">{member.email}</div>
                    </div>
                    <span className="wf-pill">{member.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="wf-empty">Ta sesja nie ma jeszcze przypisanych współtwórców.</p>
            )}
          </article>

          <article className="wf-panel-card">
            <h3>Link sesji</h3>
            <p>Udostępnij uczestnikom publiczny adres do rejestracji czasu przed ekranem.</p>
            <div className="wf-field" style={{ marginTop: 16 }}>
              <input className="wf-input" readOnly type="text" value={`/ankieta/${data.session.slug}`} />
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}