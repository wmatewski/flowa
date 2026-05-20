"use client";

import { Pencil, X } from "lucide-react";
import { useState } from "react";

interface SlugEditorProps {
  currentSlug: string;
  sessionName: string;
}

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const SlugEditor = ({ currentSlug, sessionName }: SlugEditorProps) => {
  const [editing, setEditing] = useState(false);
  const [slugValue, setSlugValue] = useState(currentSlug);

  return (
    <div className="wf-slug-editor">
      <input name="slug" type="hidden" value={editing ? slugValue : currentSlug} />
      <div className="wf-slug-display">
        <span className="wf-table-muted" style={{ fontSize: 13 }}>
          Adres sesji dla {sessionName}:{" "}
          <strong style={{ color: "var(--text)", fontFamily: "monospace" }}>{editing ? slugValue : currentSlug}</strong>
        </span>
        {!editing ? (
          <button
            className="wf-link-button"
            onClick={() => setEditing(true)}
            style={{ fontSize: 13 }}
            type="button"
          >
            <Pencil size={12} />
            Edytuj
          </button>
        ) : (
          <button
            className="wf-link-button"
            onClick={() => setEditing(false)}
            style={{ fontSize: 13, color: "var(--error)" }}
            type="button"
          >
            <X size={12} />
            Anuluj
          </button>
        )}
      </div>
      {editing ? (
        <div className="wf-field" style={{ marginTop: 8 }}>
          <span className="wf-field-label">Adres sesji (tylko a-z, 0-9 i myślniki)</span>
          <input
            className="wf-input"
            name="_slugInput"
            onChange={(event) => setSlugValue(slugify(event.target.value) || event.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
            placeholder="np. badanie-klas-5"
            style={{ fontFamily: "monospace" }}
            type="text"
            value={slugValue}
          />
          <span className="wf-table-muted" style={{ fontSize: 12 }}>
            Zobaczysz tu skróconą nazwę sesji: {slugValue || "..."}
          </span>
        </div>
      ) : null}
    </div>
  );
};
