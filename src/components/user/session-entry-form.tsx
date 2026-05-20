"use client";

import { CheckCircle2, MonitorSmartphone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [screenTimeValue, setScreenTimeValue] = useState(formatMinutesToInput(initialMinutes));
  const operatingSystemConfig = getOperatingSystemConfig(operatingSystem);

  return (
    <Card className="wf-flow-card">
      <CardHeader>
        <div className="wf-flow-icon">
          <MonitorSmartphone size={30} />
        </div>
        <CardTitle>Cyfrowe Zdrowie</CardTitle>
        <CardDescription>Podziel się informacją o swoim dzisiejszym czasie przed ekranem.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="wf-os-list" role="radiogroup" aria-label="Wybór systemu urządzenia">
          {operatingSystemOrder.map((candidate) => {
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
              </button>
            );
          })}
        </div>

        <form action={submitAction} className="wf-form-stack">
          <input name="sessionId" type="hidden" value={session.id} />
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
        </form>

        <div className="wf-step-note">
          <div className="wf-accordion-title">{operatingSystemConfig.label}</div>
          <ol className="wf-steps-list">
            {operatingSystemConfig.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
