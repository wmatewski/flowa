"use client";

import { startTransition, useEffect, useRef, useState } from "react";

interface LinkCodeFormProps {
  actionLabel: string;
  initialCode?: string;
}

const CODE_LENGTH = 6;

const normalizeCode = (value: string) => value.replace(/\D/g, "").slice(0, CODE_LENGTH);

export const LinkCodeForm = ({ actionLabel, initialCode = "" }: LinkCodeFormProps) => {
  const [digits, setDigits] = useState(() =>
    normalizeCode(initialCode).padEnd(CODE_LENGTH, " ").split(""),
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    startTransition(() => {
      setDigits(normalizeCode(initialCode).padEnd(CODE_LENGTH, " ").split(""));
    });
  }, [initialCode]);

  const setDigitAt = (index: number, value: string) => {
    const nextDigits = [...digits];
    nextDigits[index] = value || " ";
    setDigits(nextDigits);
  };
  const code = digits.join("").replace(/\s/g, "");

  return (
    <>
      <input name="code" type="hidden" value={code} />

      <div className="wf-link-code-inputs" id="wf-link-code-inputs">
        {digits.map((digit, index) => (
          <div className="wf-link-code-slot-wrap" key={index}>
            <div className="wf-link-code-slot">
              <input
                autoComplete="off"
                className="wf-link-code-input"
                inputMode="numeric"
                maxLength={1}
                onChange={(event) => {
                  const value = normalizeCode(event.target.value);
                  setDigitAt(index, value);

                  if (value && index < CODE_LENGTH - 1) {
                    inputRefs.current[index + 1]?.focus();
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digits[index]?.trim() && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  const pasted = normalizeCode(event.clipboardData.getData("text"));

                  if (!pasted) {
                    return;
                  }

                  setDigits(pasted.padEnd(CODE_LENGTH, " ").split(""));
                  const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
                  inputRefs.current[focusIndex]?.focus();
                }}
                ref={(node) => {
                  inputRefs.current[index] = node;
                }}
                type="text"
                value={digit.trim()}
              />
            </div>
            {index === 2 ? <div className="wf-link-code-divider" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>

      <button className="wf-link-primary-button" type="submit">
        {actionLabel}
      </button>
    </>
  );
};
