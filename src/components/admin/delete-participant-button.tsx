"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DeleteParticipantButtonProps {
  sessionName: string;
}

export const DeleteParticipantButton = ({ sessionName }: DeleteParticipantButtonProps) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć tę odpowiedź z ankiety \"${sessionName}\"? Tej operacji nie da się cofnąć.`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  };

  return (
    <Button onClick={handleClick} type="submit" variant="destructive">
      <Trash2 size={18} />
      Usuń odpowiedź
    </Button>
  );
};
