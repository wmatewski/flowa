"use client";

import { ArrowRight, ChevronDown, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const nextHref = `/ankieta/${sessionId}/time?age=${age}&os=${operatingSystem}`;

  return (
    <section className="wf-step-card wf-step-panel-animated">
      <div className="wf-step-header-copy">
        <div className="wf-badge" style={{ marginBottom: 12 }}>Instrukcja dla uczestnika</div>
        <h1 className="wf-step-title">Jak sprawdzić czas przed ekranem?</h1>
        <p className="wf-step-description">
          {organizationName}. Wybierz system, a poniżej pojawi się dopasowana instrukcja.
        </p>
      </div>

      <div className="wf-step-note">
        <div className="wf-inline-meta" style={{ color: "var(--text)", fontWeight: 700 }}>
          <Smartphone size={18} />
          Wykryty system: {config.label}
        </div>

        <div className="wf-step-system-row" style={{ marginTop: 12 }}>
          <div>
            <strong>{config.shortLabel}</strong>
            <p className="wf-table-muted" style={{ margin: "6px 0 0" }}>{config.description}</p>
          </div>
          <select
            className="wf-input wf-step-system-select"
            onChange={(event) => setOperatingSystem(event.target.value as OperatingSystem)}
            value={operatingSystem}
          >
            {operatingSystemOrder.map((candidate) => (
              <option key={candidate} value={candidate}>
                {getOperatingSystemConfig(candidate).label}
              </option>
            ))}
          </select>
        </div>
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

      <div className="wf-step-actions">
        {showBackLink ? (
          <Link className="wf-btn wf-btn-secondary" href={`/ankieta/${sessionId}?age=${age}`}>
            Wróć do wieku
          </Link>
        ) : (
          <span />
        )}
        <Link className="wf-btn wf-btn-primary" href={nextHref}>
          Dalej
          <ArrowRight size={18} />
        </Link>
      </div>

      <details className="wf-accordion" style={{ marginTop: 12 }}>
        <summary>
          <span>Instrukcja: Jak sprawdzić czas przed ekranem?</span>
          <ChevronDown size={18} />
        </summary>
        <div className="wf-accordion-body">
          <div>
            <div className="wf-chip-row" style={{ marginBottom: 16 }}>
              {operatingSystemOrder.map((candidate) => (
                <button
                  className={`wf-chip-button${candidate === operatingSystem ? " is-active" : ""}`}
                  key={candidate}
                  onClick={() => setOperatingSystem(candidate)}
                  type="button"
                >
                  {getOperatingSystemConfig(candidate).label}
                </button>
              ))}
            </div>
            <div className="wf-accordion-title">{config.label}</div>
            <ol className="wf-steps-list">
              {config.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </details>
    </section>
  );
};
