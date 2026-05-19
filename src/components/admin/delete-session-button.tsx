"use client";

import { Trash2 } from "lucide-react";

interface DeleteSessionButtonProps {
  sessionId: string;
  sessionName: string;
}

export const DeleteSessionButton = ({ sessionId, sessionName }: DeleteSessionButtonProps) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const confirmed = window.confirm(`Czy na pewno chcesz usunac ankiete \"${sessionName}\"? Tej operacji nie da sie cofnac.`);

    if (!confirmed) {
      event.preventDefault();
      return;
    }

    const form = event.currentTarget.form;

    if (!form) {
      return;
    }

    const confirmationInput = form.querySelector<HTMLInputElement>('input[name="confirmDelete"]');

    if (confirmationInput) {
      confirmationInput.value = sessionId;
    }
  };

  return (
    <>
      <input name="confirmDelete" type="hidden" value="" />
      <button aria-label={`Usun ${sessionName}`} className="wf-icon-button danger" onClick={handleClick} type="submit">
        <Trash2 size={18} />
      </button>
    </>
  );
};
