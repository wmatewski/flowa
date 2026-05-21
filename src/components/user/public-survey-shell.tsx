import type { ReactNode } from "react";

import { CircleHelp, PanelsTopLeft } from "lucide-react";
import Link from "next/link";

interface PublicSurveyStepItem {
  label: string;
  state: "completed" | "current" | "upcoming";
}

interface PublicSurveyShellProps {
  organizationName: string;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  topbarLeading?: ReactNode;
  sidebarDescription?: string;
  stepItems: PublicSurveyStepItem[];
}

const progressWidth = (step: number, totalSteps: number) =>
  `${Math.max(0, Math.min(100, Math.round((step / totalSteps) * 100)))}%`;

export const buildPublicSurveyStepItems = (
  includeAgeStep: boolean,
  currentStep: number,
): PublicSurveyStepItem[] => {
  const labels = includeAgeStep
    ? ["Wiek", "Wybór systemu", "Przesłanie danych", "Potwierdzenie"]
    : ["Wybór systemu", "Przesłanie danych", "Potwierdzenie"];

  return labels.map((label, index) => ({
    label,
    state:
      index + 1 < currentStep
        ? "completed"
        : index + 1 === currentStep
          ? "current"
          : "upcoming",
  }));
};

export const PublicSurveyShell = ({
  organizationName,
  step,
  totalSteps,
  title,
  description,
  children,
  actions,
  topbarLeading,
  sidebarDescription,
  stepItems,
}: PublicSurveyShellProps) => (
  <div className="wf-survey-page">
    <header className="wf-survey-topbar">
      <div className="wf-survey-topbar-slot">
        {topbarLeading ?? <span className="wf-survey-topbar-placeholder" aria-hidden="true" />}
      </div>
      <div className="wf-survey-topbar-brand" title={organizationName}>
        {organizationName}
      </div>
      <div className="wf-survey-topbar-slot wf-survey-topbar-slot-end">
        <Link aria-label="Pomoc" className="wf-survey-icon-button" href="/guides">
          <CircleHelp size={18} />
        </Link>
      </div>
    </header>

    <main className="wf-survey-main">
      <section className="wf-survey-frame">
        <aside className="wf-survey-sidebar">
          <div className="wf-survey-sidebar-icon">
            <PanelsTopLeft size={22} />
          </div>
          <div className="wf-survey-sidebar-copy">
            <h2>{organizationName}</h2>
            <p>{sidebarDescription ?? description}</p>
          </div>

          <div className="wf-survey-sidebar-steps" aria-label="Postęp ankiety">
            {stepItems.map((item, index) => (
              <div className={`wf-survey-sidebar-step is-${item.state}`} key={`${item.label}-${index}`}>
                <span className="wf-survey-sidebar-step-dot" aria-hidden="true" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="wf-survey-content">
          <div className="wf-survey-content-header">
            <p className="wf-survey-step-eyebrow">
              Krok {step} z {totalSteps}
            </p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="wf-survey-mobile-progress" aria-hidden="true">
            <div className="wf-survey-mobile-progress-track">
              <div
                className="wf-survey-mobile-progress-fill"
                style={{ width: progressWidth(step, totalSteps) }}
              />
            </div>
          </div>

          <div className="wf-survey-content-body">{children}</div>

          {actions ? <div className="wf-survey-content-actions">{actions}</div> : null}

          <Link className="wf-survey-content-footer" href="/">
            powered by Wojticore Flowa
          </Link>
        </div>
      </section>
    </main>
  </div>
);
