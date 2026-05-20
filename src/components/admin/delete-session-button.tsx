"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

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
      <Button aria-label={`Usun ${sessionName}`} onClick={handleClick} size="icon" type="submit" variant="destructive">
        <Trash2 size={18} />
      </Button>
    </>
  );
};
