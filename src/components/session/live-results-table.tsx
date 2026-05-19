"use client";

import { Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import { formatDateTime, formatMinutes, formatNumber } from "@/lib/format";
import type { LiveSessionEntry, OperatingSystem } from "@/lib/types";

interface LiveResultsTableProps {
  refreshUrl: string;
  initialEntries: LiveSessionEntry[];
  initialParticipantCount: number;
  initialAverageMinutes: number | null;
  embed?: boolean;
}

interface LiveResultsState {
  participantCount: number;
  averageMinutes: number | null;
  entries: LiveSessionEntry[];
}

const osLabels: Record<OperatingSystem, string> = {
  android: "Android",
  ios: "iOS",
  linux: "Linux",
  macos: "macOS",
  unknown: "Nieznany",
  windows: "Windows",
};

export const LiveResultsTable = ({
  refreshUrl,
  initialEntries,
  initialParticipantCount,
  initialAverageMinutes,
  embed = false,
}: LiveResultsTableProps) => {
  const [state, setState] = useState<LiveResultsState>({
    participantCount: initialParticipantCount,
    averageMinutes: initialAverageMinutes,
    entries: initialEntries,
  });

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(refreshUrl, { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const nextState = (await response.json()) as LiveResultsState;

        if (!cancelled) {
          setState(nextState);
        }
      } catch {
        return;
      }
    };

    refresh();
    const intervalId = window.setInterval(refresh, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshUrl]);

  return (
    <section className="wf-live-table-shell">
      {!embed ? (
        <div className="wf-metric-grid" style={{ marginBottom: 24 }}>
          <article className="wf-metric-card">
            <h3>Odpowiedzi na żywo</h3>
            <div className="wf-metric-value">{formatNumber(state.participantCount)}</div>
          </article>
          <article className="wf-metric-card">
            <h3>Średni czas</h3>
            <div className="wf-metric-value">{formatMinutes(state.averageMinutes)}</div>
          </article>
        </div>
      ) : null}

      <div className="wf-table-card">
        <div className="wf-page-header" style={{ marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Najnowsze odpowiedzi</h3>
            <p className="wf-table-muted">Automatyczne odświeżanie co 5 sekund.</p>
          </div>
          <div className="wf-pill wf-pill-soft">Realtime</div>
        </div>

        <div className="wf-table-head" style={{ gridTemplateColumns: "1fr 0.8fr 0.8fr 0.5fr" }}>
          <span>Czas wpisu</span>
          <span>System</span>
          <span>Czas przed ekranem</span>
          <span>Wiek</span>
        </div>

        <div>
          {state.entries.length ? (
            state.entries.map((entry) => (
              <div
                className="wf-table-row"
                key={entry.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.5fr", gap: 16 }}
              >
                <div>{formatDateTime(entry.submittedAt)}</div>
                <div>
                  <span className="wf-pill">{osLabels[entry.operatingSystem] ?? "Inny"}</span>
                </div>
                <div>{formatMinutes(entry.screenTimeMinutes)}</div>
                <div>{entry.age}</div>
              </div>
            ))
          ) : (
            <p className="wf-empty">Brak odpowiedzi do wyświetlenia.</p>
          )}
        </div>
      </div>

      <button
        className="wf-fullscreen-btn"
        onClick={handleFullscreen}
        title="Pełny ekran"
        type="button"
      >
        <Maximize2 size={20} />
      </button>
    </section>
  );
};