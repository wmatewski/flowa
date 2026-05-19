"use client";

import { useEffect } from "react";

import { getSessionEntryStorageKey } from "@/lib/session-entry";

interface SessionEntryStateProps {
  mode?: "start" | "reset";
  sessionSlug: string;
}

export const SessionEntryState = ({
  mode = "start",
  sessionSlug,
}: SessionEntryStateProps) => {
  useEffect(() => {
    try {
      const storageKey = getSessionEntryStorageKey(sessionSlug);

      if (mode === "reset") {
        window.sessionStorage.removeItem(storageKey);
        return;
      }

      if (!window.sessionStorage.getItem(storageKey)) {
        window.sessionStorage.setItem(storageKey, new Date().toISOString());
      }
    } catch {
      return;
    }
  }, [mode, sessionSlug]);

  return null;
};
