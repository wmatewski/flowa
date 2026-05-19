import type { CSSProperties } from "react";

import Link from "next/link";

import { deleteSessionSubmissionAction } from "@/app/admin/actions";
import { DeleteParticipantButton } from "@/components/admin/delete-participant-button";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionStatisticsData } from "@/lib/data";
import { formatDateTime, formatDateTimeWithSeconds, formatMinutes, formatNumber } from "@/lib/format";
import { publicEnv } from "@/lib/env/public";
import { buildSessionPublicUrl } from "@/lib/public-session";

const operatingSystemLabels = {
  android: "Android",
  ios: "iOS",
  linux: "Linux",
  macos: "macOS",
  unknown: "Nieznany",
  windows: "Windows",
} as const;

const formatDetailValue = (value: string | number | null | undefined) =>
  value == null || value === "" ? "Brak danych" : String(value);

const hasValidDateTime = (value: string | null | undefined) => {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
};

const getEntryDateLabel = (value: string | null | undefined) =>
  hasValidDateTime(value) ? "Data wejścia" : "Data wejścia (wg czasu zapisu)";

const createParticipantHref = (
  sessionId: string,
  participantId: string | null,
  participantQuery: string | string[] | undefined,
) => {
  const params = new URLSearchParams();

  if (participantQuery) {
    params.set("q", String(participantQuery));
  }

  if (participantId) {
    params.set("participant", participantId);
  }

  const serializedParams = params.toString();

  return serializedParams
    ? `/admin/sessions/${sessionId}/analytics?${serializedParams}`
    : `/admin/sessions/${sessionId}/analytics`;
};

const getFlashMessage = (query: Record<string, string | string[] | undefined>) => {
  if (query.deleted === "1") {
    return { type: "success" as const, message: "Odpowiedź została usunięta z systemu." };
  }

  return null;
};

export default async function SessionAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const flash = getFlashMessage(query);
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
  const selectedParticipantId = String(query.participant ?? "").trim();
  const participants = data.participants.filter((participant) => {
    if (!participantQuery) {
      return true;
    }

    return (
      participant.label.toLowerCase().includes(participantQuery) ||
      participant.age.toString().includes(participantQuery)
    );
  });
  const selectedParticipant =
    data.participants.find((participant) => participant.id === selectedParticipantId) ?? null;
  const maxBarValue = Math.max(...data.ageStatistics.map((stat) => stat.average_minutes ?? 0), 1);
  const maxParticipantTime = data.participants[0]?.screenTimeMinutes ?? 0;
  const publicUrl = buildSessionPublicUrl(publicEnv.appUrl, data.session.id);

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

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

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
              participants.map((participant) => {
                return (
                  <Link
                    className={`wf-table-row wf-table-row-link${selectedParticipant?.id === participant.id ? " is-selected" : ""}`}
                    href={createParticipantHref(sessionId, participant.id, query.q)}
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
                  </Link>
                );
              })
            ) : (
              <p className="wf-empty" style={{ marginTop: 20 }}>Brak uczestników dla podanego filtra.</p>
            )}
          </div>
        </article>

        <aside className="wf-panel-grid" style={{ gridTemplateColumns: "1fr" }}>
          <article className="wf-panel-card">
            <h3>Link sesji</h3>
            <p>Udostępnij uczestnikom publiczny adres do rejestracji czasu przed ekranem.</p>
            <div className="wf-field" style={{ marginTop: 16 }}>
              <input className="wf-input" readOnly type="text" value={publicUrl} />
            </div>
          </article>
        </aside>
      </section>

      {selectedParticipant ? (
        <div className="wf-modal-backdrop">
          <article
            aria-labelledby="participant-details-title"
            aria-modal="true"
            className="wf-modal-card"
            role="dialog"
          >
            <div className="wf-page-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 id="participant-details-title" style={{ margin: 0 }}>Szczegóły uczestnika</h3>
                <p className="wf-table-muted">Pełny zapis danych odpowiedzi i sesji.</p>
              </div>
              <div className="wf-card-actions">
                <span className={`wf-status-chip ${selectedParticipant.statusTone}`}>{selectedParticipant.statusLabel}</span>
                <Link
                  className="wf-btn wf-btn-secondary"
                  href={createParticipantHref(sessionId, null, query.q)}
                >
                  Zamknij
                </Link>
              </div>
            </div>

            <div className="wf-detail-stack">
              <div className="wf-member-list">
                <div className="wf-member-row">
                  <span>Uczestnik</span>
                  <strong>{selectedParticipant.label}</strong>
                </div>
                <div className="wf-member-row">
                  <span>{getEntryDateLabel(selectedParticipant.enteredAt)}</span>
                  <strong>{formatDateTimeWithSeconds(selectedParticipant.enteredAt)}</strong>
                </div>
                <div className="wf-member-row">
                  <span>Data zatwierdzenia wyniku</span>
                  <strong>{formatDateTimeWithSeconds(selectedParticipant.submittedAt)}</strong>
                </div>
                <div className="wf-member-row">
                  <span>IP</span>
                  <strong>{formatDetailValue(selectedParticipant.ipAddress)}</strong>
                </div>
                <div className="wf-member-row">
                  <span>System</span>
                  <strong>
                    {formatDetailValue(
                      selectedParticipant.clientMetadata?.operatingSystemLabel ??
                        operatingSystemLabels[selectedParticipant.detectedOperatingSystem],
                    )}
                  </strong>
                </div>
                <div className="wf-member-row">
                  <span>Czas przed ekranem</span>
                  <strong>{formatMinutes(selectedParticipant.screenTimeMinutes)}</strong>
                </div>
                <div className="wf-member-row">
                  <span>Wiek</span>
                  <strong>{selectedParticipant.age}</strong>
                </div>
              </div>

              <form action={deleteSessionSubmissionAction} className="wf-card-actions" style={{ marginTop: 20 }}>
                <input name="sessionId" type="hidden" value={sessionId} />
                <input name="participantKey" type="hidden" value={selectedParticipant.participantKey} />
                <input name="returnUrl" type="hidden" value={createParticipantHref(sessionId, null, query.q)} />
                <DeleteParticipantButton sessionName={data.session.name} />
              </form>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
