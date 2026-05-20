"use client";

import { useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { TimeInputMask } from "@/components/user/time-input-mask";
import { getSessionEntryStorageKey } from "@/lib/session-entry";
import type { OperatingSystem } from "@/lib/types";

interface ScreenTimeStepFormProps {
  age: number;
  formId?: string;
  initialMinutes?: number | null;
  operatingSystem: OperatingSystem;
  sessionId: string;
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

export const ScreenTimeStepForm = ({
  age,
  formId,
  initialMinutes,
  operatingSystem,
  sessionId,
  submitAction,
}: ScreenTimeStepFormProps) => {
  const [screenTimeValue, setScreenTimeValue] = useState(formatMinutesToInput(initialMinutes));
  const participantEnteredAtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let currentStartedAt = new Date().toISOString();

    try {
      const storageKey = getSessionEntryStorageKey(sessionId);
      const storedStartedAt = window.sessionStorage.getItem(storageKey);

      if (storedStartedAt) {
        currentStartedAt = storedStartedAt;
      } else {
        window.sessionStorage.setItem(storageKey, currentStartedAt);
      }
    } catch {
      currentStartedAt = new Date().toISOString();
    }

    if (participantEnteredAtRef.current) {
      participantEnteredAtRef.current.value = currentStartedAt;
    }
  }, [sessionId]);

  return (
    <form action={submitAction} className="wf-form-stack wf-step-form" id={formId}>
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="age" type="hidden" value={String(age)} />
      <input name="operatingSystem" type="hidden" value={operatingSystem} />
      <input defaultValue="" name="participantEnteredAt" ref={participantEnteredAtRef} type="hidden" />

      <div className="wf-survey-time-field">
        <Label className="wf-survey-time-label">Liczba godzin i minut</Label>
        <TimeInputMask
          className="wf-step-time-input"
          name="screenTimeValue"
          onChange={setScreenTimeValue}
          value={screenTimeValue}
        />
      </div>
    </form>
  );
};
