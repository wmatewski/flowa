"use client";

import { useRef, useState } from "react";

interface TimeInputMaskProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const clampHours = (h: string) => {
  const n = Number(h);
  if (Number.isNaN(n)) return h;
  return String(Math.min(n, 23));
};

const clampMinutes = (m: string) => {
  const n = Number(m);
  if (Number.isNaN(n)) return m;
  return String(Math.min(n, 59));
};

const parseValue = (value: string): { hh: string; mm: string } => {
  if (!value) return { hh: "", mm: "" };
  const parts = value.split(":");
  return {
    hh: parts[0] ?? "",
    mm: parts[1] ?? "",
  };
};

export const TimeInputMask = ({ name, value, onChange, className }: TimeInputMaskProps) => {
  const { hh: initHh, mm: initMm } = parseValue(value);
  const [hh, setHh] = useState(initHh);
  const [mm, setMm] = useState(initMm);
  const mmRef = useRef<HTMLInputElement>(null);
  const hhRef = useRef<HTMLInputElement>(null);

  const emitChange = (newHh: string, newMm: string) => {
    const h = newHh || "0";
    const m = newMm ? String(newMm).padStart(2, "0") : "00";
    onChange(newHh || newMm ? `${h}:${m}` : "");
  };

  const handleHhChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setHh(digits);
    emitChange(digits, mm);
    if (digits.length === 2) {
      mmRef.current?.focus();
      mmRef.current?.select();
    }
  };

  const handleMmChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    const clamped = digits.length === 2 ? String(clampMinutes(digits)).padStart(2, "0") : digits;
    setMm(clamped);
    emitChange(hh, clamped);
  };

  const handleHhBlur = () => {
    if (hh) {
      const clamped = String(clampHours(hh)).padStart(2, "0");
      setHh(clamped);
      emitChange(clamped, mm);
    }
  };

  const handleMmBlur = () => {
    if (mm) {
      const clamped = String(clampMinutes(mm)).padStart(2, "0");
      setMm(clamped);
      emitChange(hh, clamped);
    }
  };

  const handleMmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && mm === "") {
      hhRef.current?.focus();
    }
  };

  const hiddenValue = hh || mm ? `${hh || "0"}:${(mm || "00").padStart(2, "0")}` : "";

  return (
    <div className={`wf-time-mask${className ? ` ${className}` : ""}`}>
      <input type="hidden" name={name} value={hiddenValue} />
      <input
        aria-label="Godziny"
        className="wf-time-mask-part"
        inputMode="numeric"
        maxLength={2}
        onChange={(e) => handleHhChange(e.target.value)}
        onBlur={handleHhBlur}
        pattern="[0-9]*"
        placeholder="HH"
        ref={hhRef}
        type="text"
        value={hh}
      />
      <span className="wf-time-mask-sep" aria-hidden="true">:</span>
      <input
        aria-label="Minuty"
        className="wf-time-mask-part"
        inputMode="numeric"
        maxLength={2}
        onChange={(e) => handleMmChange(e.target.value)}
        onBlur={handleMmBlur}
        onKeyDown={handleMmKeyDown}
        pattern="[0-9]*"
        placeholder="MM"
        ref={mmRef}
        type="text"
        value={mm}
      />
    </div>
  );
};
