"use client";

import { useMemo, useState } from "react";

type SessionAgeMode = "fixed" | "variable";

interface AgeRecommendationRow {
  label: string;
  recommendedMinutes: string;
}

interface SessionAgeControlsProps {
  defaultAgeMode: SessionAgeMode;
  defaultFixedAge: number;
  defaultLimitMinutes: number;
}

const AGE_GROUP_OPTIONS = [
  "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10",
  "10-11", "11-12", "12-13", "13-14", "14-15", "15-16", "16-17", "17-18",
  "18-19", "19-20", "20-25", "25-30", "30-35", "35-40", "40-50", "50-60", "60+",
];

const MAX_GROUPS = 15;const createEmptyRow = (): AgeRecommendationRow => ({
  label: "",
  recommendedMinutes: "",
});

export const SessionAgeControls = ({
  defaultAgeMode,
  defaultFixedAge,
  defaultLimitMinutes,
}: SessionAgeControlsProps) => {
  const [ageMode, setAgeMode] = useState<SessionAgeMode>(defaultAgeMode);
  const [fixedAge, setFixedAge] = useState(String(defaultFixedAge));
  const [limitMinutes, setLimitMinutes] = useState(String(defaultLimitMinutes));
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);
  const [rows, setRows] = useState<AgeRecommendationRow[]>([createEmptyRow()]);

  const serializedRecommendations = useMemo(() => {
    const payload = rows
      .map((row) => ({
        label: row.label.trim(),
        recommendedMinutes: Number(row.recommendedMinutes),
      }))
      .filter((row) => row.label && !Number.isNaN(row.recommendedMinutes) && row.recommendedMinutes > 0);

    return JSON.stringify(recommendationsEnabled ? payload : []);
  }, [recommendationsEnabled, rows]);

  const updateRow = (index: number, field: keyof AgeRecommendationRow, value: string) => {
    setRows((currentRows) => {
      const nextRows = [...currentRows];
      nextRows[index] = {
        ...nextRows[index],
        [field]: value,
      };

      if (index === nextRows.length - 1 && nextRows.length < MAX_GROUPS) {
        const hasAnyValue = nextRows[index].label.trim().length > 0 || nextRows[index].recommendedMinutes.trim().length > 0;

        if (hasAnyValue) {
          nextRows.push(createEmptyRow());
        }
      }

      return nextRows;
    });
  };

  return (
    <>
      <input name="ageMode" type="hidden" value={ageMode} />
      <input name="ageRecommendations" type="hidden" value={serializedRecommendations} />

      <div className="wf-field">
        <span className="wf-field-label">Tryb wieku</span>
        <div className="wf-settings-radio-grid">
          <label className={`wf-settings-radio${ageMode === "variable" ? " is-active" : ""}`}>
            <div className="wf-settings-radio-top">
              <input checked={ageMode === "variable"} onChange={() => setAgeMode("variable")} type="radio" />
              <div>
                <strong>Wiek wpisuje uczestnik</strong>
                <p className="wf-table-muted">Uczestnik podaje własny wiek, a Ty możesz dodać dopasowane zalecenia w tabeli.</p>
              </div>
            </div>
          </label>

          <label className={`wf-settings-radio${ageMode === "fixed" ? " is-active" : ""}`}>
            <div className="wf-settings-radio-top">
              <input checked={ageMode === "fixed"} onChange={() => setAgeMode("fixed")} type="radio" />
              <div>
                <strong>Stały wiek dla całej sesji</strong>
                <p className="wf-table-muted">Wszyscy uczestnicy korzystają z tego samego wieku i jednej rekomendacji czasu.</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="wf-settings-grid">
        <label className="wf-field">
          <span className="wf-field-label">Zalecany czas sesji (minuty)</span>
          <input className="wf-input" min="1" name="limitMinutes" onChange={(event) => setLimitMinutes(event.target.value)} type="number" value={limitMinutes} />
          <span className="wf-table-muted">
            To jest zalecenie, nie twardy limit. W tabeli można doprecyzować wartości dla grup wiekowych.
          </span>
        </label>

        {ageMode === "fixed" ? (
          <label className="wf-field">
            <span className="wf-field-label">Wiek dla całej sesji</span>
            <input className="wf-input" min="1" name="fixedAge" onChange={(event) => setFixedAge(event.target.value)} type="number" value={fixedAge} />
            <span className="wf-table-muted">Wpisz konkretny wiek dla wszystkich uczestników.</span>
          </label>
        ) : null}
      </div>

      {ageMode === "variable" ? (
        <section className="wf-panel-card" style={{ padding: 20 }}>
          <div className="wf-page-header" style={{ alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Zalecenia dla grup wiekowych</h3>
              <p className="wf-table-muted">Wpisuj kolejne grupy. Pojawi się zawsze jeden pusty wiersz więcej, aż do 15 grup.</p>
            </div>

            <label className="wf-inline-meta" style={{ color: "var(--text)" }}>
              <input
                checked={recommendationsEnabled}
                name="ageRecommendationsEnabled"
                onChange={(event) => setRecommendationsEnabled(event.target.checked)}
                type="checkbox"
                value="1"
              />
              Włącz zalecenia
            </label>
          </div>

          {recommendationsEnabled ? (
            <div className="wf-table-card" style={{ padding: 0, border: 0, boxShadow: "none" }}>
              <div className="wf-table-head" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
                <span>Grupa wiekowa</span>
                <span>Zalecany czas</span>
              </div>

              <div>
                {rows.map((row, index) => (
                  <div
                    className="wf-table-row"
                    key={`age-row-${index}`}
                    style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}
                  >
                    <input
                      autoComplete="off"
                      className="wf-input"
                      list="wf-age-group-list"
                      name={`ageGroup-${index}`}
                      onChange={(event) => updateRow(index, "label", event.target.value)}
                      placeholder="np. 13-14"
                      type="text"
                      value={row.label}
                    />
                    <input
                      className="wf-input"
                      min="1"
                      name={`ageGroupMinutes-${index}`}
                      onChange={(event) => updateRow(index, "recommendedMinutes", event.target.value)}
                      placeholder="np. 120"
                      type="number"
                      value={row.recommendedMinutes}
                    />
                  </div>
                ))}
              </div>
              <datalist id="wf-age-group-list">
                {AGE_GROUP_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          ) : (
            <p className="wf-empty" style={{ marginTop: 0 }}>
              Zalecenia są wyłączone. Sesja zostanie zapisana bez tabeli grup wiekowych.
            </p>
          )}
        </section>
      ) : null}
    </>
  );
};