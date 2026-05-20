"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOperatingSystemConfig, operatingSystemOrder } from "@/lib/os";
import type { OperatingSystem } from "@/lib/types";

interface PublicOperatingSystemStepProps {
  age: number;
  initialOperatingSystem: OperatingSystem;
  organizationName: string;
  sessionId: string;
  showBackLink?: boolean;
}

export const PublicOperatingSystemStep = ({
  age,
  initialOperatingSystem,
  organizationName,
  sessionId,
  showBackLink = true,
}: PublicOperatingSystemStepProps) => {
  const [operatingSystem, setOperatingSystem] = useState(initialOperatingSystem);
  const config = useMemo(() => getOperatingSystemConfig(operatingSystem), [operatingSystem]);
  const isMobileSystem = config.key === "android" || config.key === "ios";
  const nextHref = `/ankieta/${sessionId}/time?age=${age}&os=${operatingSystem}`;

  return (
    <section className="wf-step-card wf-step-panel-animated">
      <div className="wf-step-header-copy">
        <Badge style={{ marginBottom: 12 }}>Wybór systemu</Badge>
        <h1 className="wf-step-title">Wybierz system urządzenia</h1>
        <p className="wf-step-description">
          {organizationName}. Po wyborze od razu pokażemy dopasowaną instrukcję.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ margin: 0 }}>{config.label}</CardTitle>
          <CardDescription>{config.headline}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="wf-chip-row" style={{ marginBottom: 4 }}>
            {operatingSystemOrder.map((candidate) => (
              <Button
                key={candidate}
                onClick={() => setOperatingSystem(candidate)}
                type="button"
                variant={candidate === operatingSystem ? "default" : "outline"}
              >
                {getOperatingSystemConfig(candidate).label}
              </Button>
            ))}
          </div>

          <div className="wf-step-note" style={{ marginBottom: 0 }}>
            <div className="wf-inline-meta" style={{ color: "var(--text)", fontWeight: 700 }}>
              <Badge variant="secondary">Wybrany system</Badge>
              <span>{config.shortLabel}</span>
            </div>
            <p className="wf-table-muted" style={{ margin: "10px 0 0" }}>
              {config.description}
            </p>
          </div>

          {isMobileSystem && config.settingsLink ? (
            <Button asChild className="wf-btn-block" variant="secondary">
              <a href={config.settingsLink}>{config.settingsButtonLabel}</a>
            </Button>
          ) : null}

          <div className="wf-step-list">
            {config.steps.map((step, index) => (
              <div key={step}>
                <div className="wf-step-list-item">
                  <div className="wf-step-index">{index + 1}</div>
                  <div>{step}</div>
                </div>
                {index < config.steps.length - 1 ? <div className="wf-step-divider" /> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="wf-step-actions">
        {showBackLink ? (
          <Button asChild variant="secondary">
            <Link href={`/ankieta/${sessionId}?age=${age}`}>Wróć do wieku</Link>
          </Button>
        ) : (
          <span />
        )}
        <Button asChild>
          <Link href={nextHref}>
            Dalej
            <ArrowRight size={18} />
          </Link>
        </Button>
      </div>
    </section>
  );
};
