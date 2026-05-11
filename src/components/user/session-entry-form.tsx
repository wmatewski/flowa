"use client";

import { ChevronDown, CheckCircle2, MonitorSmartphone, Smartphone } from "lucide-react";
import { useState } from "react";

import { getOperatingSystemConfig, operatingSystemOrder } from "@/lib/os";
import type { OperatingSystem, Session } from "@/lib/types";

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

const formatTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
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
        <input name="sessionSlug" type="hidden" value={session.slug} />
        <input name="age" type="hidden" value={String(age)} />
        <input name="operatingSystem" type="hidden" value={operatingSystem} />

        <label className="wf-field">
          <span className="wf-field-label">Twój czas przed ekranem dzisiaj (godziny i minuty)</span>
          <input
            className="wf-time-input"
            inputMode="numeric"
            name="screenTimeValue"
            onChange={(event) => setScreenTimeValue(formatTimeInput(event.target.value))}
            pattern="[0-9:]*"
            placeholder="np. 04:50"
            value={screenTimeValue}
          />
          <span className="wf-field-hint">
            Format GG:MM, np. 04:50 lub 11:50. Po wpisaniu dwóch cyfr dwukropek zostanie dodany automatycznie.
          </span>
        </label>

        <button className="wf-btn wf-btn-primary wf-btn-block wf-btn-large" type="submit">
          <CheckCircle2 size={20} />
          Wyślij
        </button>

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