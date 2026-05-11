"use client";

import { LogOut } from "lucide-react";

import { useClerk } from "@clerk/nextjs";

export const LogoutButton = () => {
  const clerk = useClerk();

  return (
    <button
      className="wf-btn wf-btn-secondary wf-btn-block"
      onClick={() => clerk.signOut({ redirectUrl: "/auth" })}
      type="button"
    >
      <LogOut size={18} />
      Wyloguj
    </button>
  );
};
