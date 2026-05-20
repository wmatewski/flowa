"use client";

import { useEffect } from "react";

import { getSessionEntryStorageKey } from "@/lib/session-entry";

interface SessionEntryStateProps {
  mode?: "start" | "reset";
  sessionId: string;
}

export const SessionEntryState = ({
  mode = "start",
  sessionId,
}: SessionEntryStateProps) => {
  useEffect(() => {
    try {
      const storageKey = getSessionEntryStorageKey(sessionId);

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
  }, [mode, sessionId]);

  return null;
};
