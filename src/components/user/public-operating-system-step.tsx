"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  const isMobileSession = initialOperatingSystem === "android" || initialOperatingSystem === "ios";
  const availableSystems = isMobileSession
    ? (["ios", "android"] as const)
    : operatingSystemOrder;
  const initialSelection: OperatingSystem =
    isMobileSession && initialOperatingSystem !== "android" ? "ios" : initialOperatingSystem;
  const [operatingSystem, setOperatingSystem] = useState<OperatingSystem>(initialSelection);
  const config = getOperatingSystemConfig(operatingSystem);
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
          <CardTitle style={{ margin: 0 }}>Wybierz z listy</CardTitle>
          <CardDescription>Wybór zmienia instrukcję poniżej bez przeładowania strony.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="wf-os-list" role="radiogroup" aria-label="Wybór systemu urządzenia">
            {availableSystems.map((candidate) => {
              const candidateConfig = getOperatingSystemConfig(candidate);
              const isActive = candidate === operatingSystem;

              return (
                <button
                  aria-checked={isActive}
                  className={`wf-os-list-item${isActive ? " is-active" : ""}`}
                  key={candidate}
                  onClick={() => setOperatingSystem(candidate)}
                  role="radio"
                  type="button"
                >
                  <span className="wf-os-list-item-copy">
                    <strong>{candidateConfig.label}</strong>
                    <span>{candidateConfig.shortLabel}</span>
                  </span>
                  {isActive ? <Check size={18} /> : null}
                </button>
              );
            })}
          </div>

          <div className="wf-step-note" style={{ marginBottom: 0 }}>
            <div className="wf-inline-meta" style={{ color: "var(--text)", fontWeight: 700 }}>
              <span>{config.label}</span>
            </div>
            <p className="wf-table-muted" style={{ margin: "10px 0 0" }}>
              {config.description}
            </p>
          </div>

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
