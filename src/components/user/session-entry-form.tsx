"use client";

import { ChevronDown, CheckCircle2, MonitorSmartphone, Smartphone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getOperatingSystemConfig, operatingSystemOrder } from "@/lib/os";
import type { OperatingSystem, Session } from "@/lib/types";
import { TimeInputMask } from "@/components/user/time-input-mask";

interface SessionEntryFormProps {
  age: number;
  initialOperatingSystem: OperatingSystem;
  session: Session;
  initialMinutes?: number | null;
  submitAction: (formData: FormData) => Promise<void>;
}

const formatMinutesToInput = (minutes: number | null | undefined) => {
  if (minutes == null || Number.isNaN(minutes)) {
    return "";
  }

  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
};

export const SessionEntryForm = ({
  age,
  initialOperatingSystem,
  session,
  initialMinutes,
  submitAction,
}: SessionEntryFormProps) => {
  const [operatingSystem, setOperatingSystem] = useState(initialOperatingSystem);
  const [showPicker, setShowPicker] = useState(false);
  const [screenTimeValue, setScreenTimeValue] = useState(formatMinutesToInput(initialMinutes));
  const operatingSystemConfig = getOperatingSystemConfig(operatingSystem);

  return (
    <div className="wf-flow-card">
      <div className="wf-os-badge-row">
        <div className="wf-os-badge">
          <span className="wf-os-badge-copy">
            <Smartphone size={14} />
            Wykryty system: {operatingSystemConfig.label}
          </span>
          <button
            className="wf-link-button"
            onClick={() => setShowPicker((current) => !current)}
            type="button"
          >
            Zmień
          </button>
        </div>
      </div>

      {showPicker ? (
        <div className="wf-chip-row" style={{ marginBottom: 24 }}>
          {operatingSystemOrder.map((candidate) => (
            <button
              className={`wf-chip-button${candidate === operatingSystem ? " is-active" : ""}`}
              key={candidate}
              onClick={() => {
                setOperatingSystem(candidate);
                setShowPicker(false);
              }}
              type="button"
            >
              {getOperatingSystemConfig(candidate).label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="wf-flow-header">
        <div className="wf-flow-icon">
          <MonitorSmartphone size={30} />
        </div>
        <h1>Cyfrowe Zdrowie</h1>
        <p>Podziel się informacją o swoim dzisiejszym czasie przed ekranem.</p>
      </div>

      <form action={submitAction} className="wf-form-stack">
        <input name="sessionId" type="hidden" value={session.id} />
        <input name="sessionSlug" type="hidden" value={session.id} />
        <input name="age" type="hidden" value={String(age)} />
        <input name="operatingSystem" type="hidden" value={operatingSystem} />

        <label className="wf-field">
          <span className="wf-field-label">Twój czas przed ekranem dzisiaj (godziny i minuty)</span>
          <TimeInputMask
            className="wf-step-time-input"
            name="screenTimeValue"
            onChange={setScreenTimeValue}
            value={screenTimeValue}
          />
          <span className="wf-field-hint">
            Wpisz godziny i minuty — dwukropek jest stały i widoczny.
          </span>
        </label>

        <Button className="wf-btn-block wf-btn-large" type="submit">
          <CheckCircle2 size={20} />
          Wyślij
        </Button>

        <details className="wf-accordion">
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
              <div className="wf-accordion-title">{operatingSystemConfig.label}</div>
              <ol className="wf-steps-list">
                {operatingSystemConfig.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </details>
      </form>
    </div>
  );
};
