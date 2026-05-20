"use client";

import { Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMinutes, formatNumber } from "@/lib/format";
import type { LiveSessionEntry } from "@/lib/types";

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
          <Card>
            <CardHeader>
              <CardTitle>Odpowiedzi na żywo</CardTitle>
              <CardDescription>Aktualna liczba zapisanych odpowiedzi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="wf-metric-value">{formatNumber(state.participantCount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Średni czas</CardTitle>
              <CardDescription>Średnia z całej sesji, odświeżana automatycznie.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="wf-metric-value">{formatMinutes(state.averageMinutes)}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader className="items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Najnowsze odpowiedzi</CardTitle>
            <CardDescription>Widok odświeża się automatycznie co kilka sekund.</CardDescription>
          </div>
          <span className="wf-pill wf-pill-soft">Na żywo</span>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Czas wpisu</TableHead>
                <TableHead>Czas przed ekranem</TableHead>
                <TableHead>Wiek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.entries.length ? (
                state.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDateTime(entry.submittedAt)}</TableCell>
                    <TableCell>{formatMinutes(entry.screenTimeMinutes)}</TableCell>
                    <TableCell>{entry.age}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>
                    <p className="wf-empty">Brak odpowiedzi do wyświetlenia.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button
        className="wf-fullscreen-btn"
        size="icon"
        variant="secondary"
        onClick={handleFullscreen}
        title="Pełny ekran"
        type="button"
      >
        <Maximize2 size={20} />
      </Button>
    </section>
  );
};
