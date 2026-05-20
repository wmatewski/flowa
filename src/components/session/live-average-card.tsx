"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import { formatMinutes } from "@/lib/format";

interface LiveAverageCardProps {
  refreshUrl: string;
  initialAverageMinutes: number | null;
  screenTimeLimitMinutes: number;
}

interface LiveAverageResponse {
  averageMinutes: number | null;
}

const AVG_RING_RADIUS = 49;
const AVG_RING_CIRCUMFERENCE = 2 * Math.PI * AVG_RING_RADIUS;

export const LiveAverageCard = ({
  refreshUrl,
  initialAverageMinutes,
  screenTimeLimitMinutes,
}: LiveAverageCardProps) => {
  const [averageMinutes, setAverageMinutes] = useState<number | null>(initialAverageMinutes);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(refreshUrl, { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const nextState = (await response.json()) as LiveAverageResponse;

        if (!cancelled) {
          setAverageMinutes(nextState.averageMinutes ?? null);
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

  const averagePercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(((averageMinutes ?? 0) / Math.max(screenTimeLimitMinutes, 1)) * 100),
    ),
  );
  const averageRingOffset = AVG_RING_CIRCUMFERENCE - (averagePercent / 100) * AVG_RING_CIRCUMFERENCE;

  return (
    <article className="wf-live-results-card wf-live-results-average-card">
      <h2 className="wf-live-results-card-title">Średni czas przed ekranem</h2>
      <div className="wf-live-results-average-body">
        <div className="wf-live-results-average-ring" aria-hidden="true">
          <svg className="wf-live-results-average-ring-svg" viewBox="0 0 132 132">
            <circle className="wf-live-results-average-ring-track" cx="66" cy="66" r="49" />
            <circle
              className="wf-live-results-average-ring-progress"
              cx="66"
              cy="66"
              r="49"
              style={{ strokeDashoffset: averageRingOffset }}
            />
          </svg>
          <Smartphone className="wf-live-results-average-icon" size={36} />
        </div>
        <div aria-live="polite" className="wf-live-results-average-value">
          {formatMinutes(averageMinutes)}
        </div>
      </div>
    </article>
  );
};
