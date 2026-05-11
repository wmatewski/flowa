"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  value: string;
  label: string;
  copiedLabel?: string;
  className?: string;
}

export const CopyButton = ({
  value,
  label,
  copiedLabel = "Skopiowano",
  className,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button className={className ?? "wf-btn wf-btn-secondary"} onClick={handleCopy} type="button">
      {copied ? <Check size={18} /> : <Copy size={18} />}
      {copied ? copiedLabel : label}
    </button>
  );
};