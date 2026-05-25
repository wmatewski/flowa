"use client";

import { ArrowLeft, ArrowRight, Apple, Check, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  PublicSurveyShell,
  buildPublicSurveyStepItems,
} from "@/components/user/public-survey-shell";
import { getAvailableOperatingSystems, getOperatingSystemConfig } from "@/lib/os";
import type { AgeMode, OperatingSystem } from "@/lib/types";

interface PublicOperatingSystemStepProps {
  age: number;
  ageMode: AgeMode;
  availableOperatingSystems: OperatingSystem[];
  initialOperatingSystem: OperatingSystem;
  organizationName: string;
  sessionId: string;
  sessionName: string;
}

const getOperatingSystemIcon = (value: OperatingSystem) => {
  if (value === "ios") {
    return Apple;
  }

  if (value === "android") {
    return Smartphone;
  }

  return Monitor;
};

const getOperatingSystemHint = (value: OperatingSystem) => {
  if (value === "ios") {
    return "Apple iPhone i iPad";
  }

  if (value === "android") {
    return "Telefony z Androidem";
  }

  if (value === "windows") {
    return "Komputery i laptopy z Windows";
  }

  if (value === "macos") {
    return "Komputery Apple Mac";
  }

  if (value === "linux") {
    return "Komputery z Linuxem";
  }

  return "Wybierz urzadzenie";
};

export const PublicOperatingSystemStep = ({
  age,
  ageMode,
  availableOperatingSystems,
  initialOperatingSystem,
  organizationName,
  sessionId,
  sessionName,
}: PublicOperatingSystemStepProps) => {
  const serverAllowedOperatingSystems = useMemo(() => {
    const filtered = availableOperatingSystems.filter((value) => value !== "unknown");

    return filtered.length ? filtered : (["ios", "android"] as OperatingSystem[]);
  }, [availableOperatingSystems]);
  const [allowedOperatingSystems, setAllowedOperatingSystems] = useState(serverAllowedOperatingSystems);
  const hasAgeStep = ageMode === "variable";
  const totalSteps = hasAgeStep ? 4 : 3;
  const previousHref = hasAgeStep ? `/ankieta/${sessionId}?age=${age}` : "/";
  const seededSelection = serverAllowedOperatingSystems.includes(initialOperatingSystem)
    ? initialOperatingSystem
    : serverAllowedOperatingSystems[0];
  const shouldOpenInstructionsByDefault = serverAllowedOperatingSystems.includes(initialOperatingSystem);
  const [selectedOperatingSystem, setSelectedOperatingSystem] = useState<OperatingSystem>(
    seededSelection,
  );
  const [view, setView] = useState<"select" | "instructions">(
    shouldOpenInstructionsByDefault ? "instructions" : "select",
  );
  const selectedConfig = getOperatingSystemConfig(selectedOperatingSystem);
  const nextHref = `/ankieta/${sessionId}/time?age=${age}&os=${selectedOperatingSystem}`;

  useEffect(() => {
    setAllowedOperatingSystems(serverAllowedOperatingSystems);
  }, [serverAllowedOperatingSystems]);

  useEffect(() => {
    const clientAllowedOperatingSystems = getAvailableOperatingSystems(window.navigator.userAgent);

    setAllowedOperatingSystems((current) => {
      if (
        current.length === clientAllowedOperatingSystems.length &&
        current.every((value, index) => value === clientAllowedOperatingSystems[index])
      ) {
        return current;
      }

      return clientAllowedOperatingSystems;
    });
  }, []);

  useEffect(() => {
    if (allowedOperatingSystems.includes(selectedOperatingSystem)) {
      return;
    }

    setSelectedOperatingSystem(allowedOperatingSystems[0]);
    setView("select");
  }, [allowedOperatingSystems, selectedOperatingSystem]);

  const leadingAction =
    view === "instructions" ? (
      <button
        aria-label="Wroc do wyboru systemu"
        className="wf-survey-icon-button"
        onClick={() => setView("select")}
        type="button"
      >
        <ArrowLeft size={18} />
      </button>
    ) : hasAgeStep ? (
      <Link aria-label="Wstecz" className="wf-survey-icon-button" href={previousHref}>
        <ArrowLeft size={18} />
      </Link>
    ) : null;

  return (
    <PublicSurveyShell
      actions={
        <div className="wf-survey-action-bar">
          {view === "instructions" ? (
            <button
              className="wf-survey-action wf-survey-action-secondary"
              onClick={() => setView("select")}
              type="button"
            >
              <ArrowLeft size={18} />
              <span>Wstecz</span>
            </button>
          ) : hasAgeStep ? (
            <Link className="wf-survey-action wf-survey-action-secondary" href={previousHref}>
              <ArrowLeft size={18} />
              <span>Wstecz</span>
            </Link>
          ) : null}

          {view === "instructions" ? (
            <Link className="wf-survey-action wf-survey-action-primary" href={nextHref}>
              <span>Dalej</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <button
              className="wf-survey-action wf-survey-action-primary is-disabled"
              disabled
              type="button"
            >
              <span>Dalej</span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      }
      description="Wybierz system urzadzenia, a potem od razu zobaczysz dopasowana instrukcje dla tego kroku."
      organizationName={organizationName}
      sidebarDescription={`Ankieta "${sessionName}" poprowadzi Cie krok po kroku. Najpierw wybierz urzadzenie, z ktorego chcesz odczytac czas przed ekranem.`}
      step={hasAgeStep ? 2 : 1}
      stepItems={buildPublicSurveyStepItems(hasAgeStep, hasAgeStep ? 2 : 1)}
      title="Wybierz swoj system"
      topbarLeading={leadingAction ?? undefined}
      totalSteps={totalSteps}
    >
      {view === "select" ? (
        <div className="wf-survey-os-grid">
          {allowedOperatingSystems.map((candidate) => {
            const Icon = getOperatingSystemIcon(candidate);
            const config = getOperatingSystemConfig(candidate);

            return (
              <button
                className="wf-survey-os-card"
                key={candidate}
                onClick={() => {
                  setSelectedOperatingSystem(candidate);
                  setView("instructions");
                }}
                type="button"
              >
                <span className="wf-survey-os-card-icon">
                  <Icon size={26} />
                </span>
                <span className="wf-survey-os-card-title">{config.label}</span>
                <span className="wf-survey-os-card-description">{getOperatingSystemHint(candidate)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="wf-survey-instruction-panel">
          <div className="wf-survey-instruction-header">
            <div className="wf-survey-instruction-icon">
              {(() => {
                const Icon = getOperatingSystemIcon(selectedOperatingSystem);

                return <Icon size={24} />;
              })()}
            </div>
            <div>
              <h2>{selectedConfig.label}</h2>
              <p>{selectedConfig.description}</p>
            </div>
          </div>

          <div className="wf-survey-instruction-note">
            <strong>Instrukcja dla {selectedConfig.label}</strong>
            <span>{selectedConfig.headline}</span>
          </div>

          <div className="wf-survey-instruction-steps">
            {selectedConfig.steps.map((step, index) => (
              <div className="wf-survey-instruction-step" key={`${selectedConfig.key}-${index}`}>
                <span className="wf-survey-instruction-step-index">{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          {selectedConfig.settingsHint ? (
            <div className="wf-survey-instruction-tip">
              <Check size={16} />
              <span>{selectedConfig.settingsHint}</span>
            </div>
          ) : null}
        </div>
      )}
    </PublicSurveyShell>
  );
};
