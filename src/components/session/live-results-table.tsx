"use client";

import { useEffect, useState } from "react";

import { formatLiveTimestamp, formatMinutes } from "@/lib/format";
import type { LiveSessionEntry } from "@/lib/types";

interface LiveResultsTableProps {
  refreshUrl: string;
  initialEntries: LiveSessionEntry[];
}

interface LiveResultsState {
  entries: LiveSessionEntry[];
}

const dedupeEntries = (entries: LiveSessionEntry[]) => {
  const unique = new Map<string, LiveSessionEntry>();

  for (const entry of entries) {
    unique.set(entry.id, entry);
  }

  return Array.from(unique.values()).sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
  );
};

export const LiveResultsTable = ({ refreshUrl, initialEntries }: LiveResultsTableProps) => {
  const [state, setState] = useState<LiveResultsState>({
    entries: dedupeEntries(initialEntries),
  });

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
          setState({
            entries: dedupeEntries(nextState.entries ?? []),
          });
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
    <section className="wf-live-results-table-card">
      <div className="wf-live-results-table-header">
        <h2 className="wf-live-results-table-title">Ostatnie odpowiedzi</h2>
      </div>

      <div className="wf-live-results-table-scroll">
        <table className="wf-live-results-table">
          <thead>
            <tr>
              <th>Czas wpisu</th>
              <th>Czas przed ekranem</th>
              <th>Wiek</th>
            </tr>
          </thead>
          <tbody>
            {state.entries.length ? (
              state.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatLiveTimestamp(entry.submittedAt)}</td>
                  <td className="wf-live-results-table-emphasis">
                    {formatMinutes(entry.screenTimeMinutes)}
                  </td>
                  <td>{entry.age}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="wf-live-results-table-empty" colSpan={3}>
                  Brak odpowiedzi do wyświetlenia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
