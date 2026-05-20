"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSessionEntryStorageKey } from "@/lib/session-entry";
import type { OperatingSystem } from "@/lib/types";
import { TimeInputMask } from "@/components/user/time-input-mask";

interface ScreenTimeStepFormProps {
  age: number;
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
    <form action={submitAction} className="wf-form-stack wf-step-form">
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="age" type="hidden" value={String(age)} />
      <input name="operatingSystem" type="hidden" value={operatingSystem} />
      <input defaultValue="" name="participantEnteredAt" ref={participantEnteredAtRef} type="hidden" />

      <div className="space-y-2">
        <Label>Liczba godzin i minut</Label>
        <TimeInputMask
          className="wf-step-time-input"
          name="screenTimeValue"
          onChange={setScreenTimeValue}
          value={screenTimeValue}
        />
      </div>

      <Button className="wf-btn-block wf-btn-large" type="submit">
        Wyślij wynik
        <ArrowRight size={18} />
      </Button>
    </form>
  );
};
