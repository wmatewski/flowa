"use client";

import { Trash2 } from "lucide-react";

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
    <button className="wf-btn wf-btn-secondary danger" onClick={handleClick} type="submit">
      <Trash2 size={18} />
      Usuń odpowiedź
    </button>
  );
};
