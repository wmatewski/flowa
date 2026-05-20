"use client";

import { Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMinutes } from "@/lib/format";
import type { LiveSessionEntry } from "@/lib/types";

interface LiveResultsTableProps {
  refreshUrl: string;
  initialEntries: LiveSessionEntry[];
}

interface LiveResultsState {
  entries: LiveSessionEntry[];
}

export const LiveResultsTable = ({
  refreshUrl,
  initialEntries,
}: LiveResultsTableProps) => {
  const [state, setState] = useState<LiveResultsState>({
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
      <Card>
        <CardHeader className="items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Ostatnie odpowiedzi</CardTitle>
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
