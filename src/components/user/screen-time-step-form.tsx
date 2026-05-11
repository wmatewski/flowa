"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import type { OperatingSystem } from "@/lib/types";

interface ScreenTimeStepFormProps {
  age: number;
  initialMinutes?: number | null;
  operatingSystem: OperatingSystem;
  sessionId: string;
  sessionSlug: string;
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

  return `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`;
};

const presets = [30, 60, 120, 240];

const presetToInput = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
};

const presetLabel = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const ScreenTimeStepForm = ({
  age,
  initialMinutes,
  operatingSystem,
  sessionId,
  sessionSlug,
  submitAction,
}: ScreenTimeStepFormProps) => {
  const [screenTimeValue, setScreenTimeValue] = useState(formatMinutesToInput(initialMinutes));

  return (
    <form action={submitAction} className="wf-form-stack wf-step-form">
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="sessionSlug" type="hidden" value={sessionSlug} />
      <input name="age" type="hidden" value={String(age)} />
      <input name="operatingSystem" type="hidden" value={operatingSystem} />

      <label className="wf-field">
        <span className="wf-field-label">Liczba godzin i minut</span>
        <input
          className="wf-time-input wf-step-time-input"
          inputMode="numeric"
          name="screenTimeValue"
          onChange={(event) => setScreenTimeValue(formatTimeInput(event.target.value))}
          pattern="[0-9:]*"
          placeholder="np. 2:30"
          value={screenTimeValue}
        />
      </label>

      <div className="wf-chip-row">
        {presets.map((minutes) => (
          <button
            className="wf-chip-button"
            key={minutes}
            onClick={() => setScreenTimeValue(presetToInput(minutes))}
            type="button"
          >
            {presetLabel(minutes)}
          </button>
        ))}
      </div>

      <button className="wf-btn wf-btn-primary wf-btn-block wf-btn-large" type="submit">
        Wyślij wynik
        <ArrowRight size={18} />
      </button>
    </form>
  );
};