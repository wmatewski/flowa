"use client";

import { LogOut } from "lucide-react";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const LogoutButton = () => {
  const clerk = useClerk();

  return (
    <Button className="wf-btn-block" onClick={() => clerk.signOut({ redirectUrl: "/login" })} type="button" variant="secondary">
      <LogOut size={18} />
      Wyloguj
    </Button>
  );
};
