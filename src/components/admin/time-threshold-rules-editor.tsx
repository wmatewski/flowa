"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MAX_TIME_THRESHOLD_RULES, serializeTimeThresholdRules } from "@/lib/time-thresholds";
import type { TimeThresholdRule } from "@/lib/types";

interface TimeThresholdRulesEditorProps {
  initialRules: TimeThresholdRule[];
  name: string;
}

interface TimeThresholdRow {
  minPercent: string;
  maxPercent: string;
  message: string;
}

const createEmptyRow = (): TimeThresholdRow => ({
  minPercent: "",
  maxPercent: "",
  message: "",
});

const mapRuleToRow = (rule: TimeThresholdRule): TimeThresholdRow => ({
  minPercent: String(rule.minPercent),
  maxPercent: String(rule.maxPercent),
  message: rule.message,
});

export const TimeThresholdRulesEditor = ({ initialRules, name }: TimeThresholdRulesEditorProps) => {
  const [rows, setRows] = useState<TimeThresholdRow[]>(
    initialRules.length
      ? [
          ...initialRules.slice(0, MAX_TIME_THRESHOLD_RULES).map(mapRuleToRow),
          ...(initialRules.length < MAX_TIME_THRESHOLD_RULES ? [createEmptyRow()] : []),
        ]
      : [createEmptyRow()],
  );

  const serializableRules = useMemo(() => {
    return rows
      .map((row) => {
        const minPercent = Number(row.minPercent);
        const maxPercent = Number(row.maxPercent);
        const message = row.message.trim();

        if (
          Number.isNaN(minPercent) ||
          Number.isNaN(maxPercent) ||
          minPercent < 0 ||
          maxPercent < 0 ||
          minPercent > maxPercent ||
          !message
        ) {
          return null;
        }

        return {
          minPercent: Math.round(minPercent),
          maxPercent: Math.round(maxPercent),
          message,
        } satisfies TimeThresholdRule;
      })
      .filter((value): value is TimeThresholdRule => value !== null)
      .slice(0, MAX_TIME_THRESHOLD_RULES);
  }, [rows]);

  const updateRow = (index: number, field: keyof TimeThresholdRow, value: string) => {
    setRows((currentRows) => {
      const nextRows = [...currentRows];
      nextRows[index] = {
        ...nextRows[index],
        [field]: value,
      };

      const isLastRow = index === nextRows.length - 1;
      const hasValue =
        nextRows[index].minPercent.trim().length > 0 ||
        nextRows[index].maxPercent.trim().length > 0 ||
        nextRows[index].message.trim().length > 0;

      if (isLastRow && hasValue && nextRows.length < MAX_TIME_THRESHOLD_RULES) {
        nextRows.push(createEmptyRow());
      }

      return nextRows;
    });
  };

  const removeRow = (index: number) => {
    setRows((currentRows) => {
      const nextRows = currentRows.filter((_, rowIndex) => rowIndex !== index);
      return nextRows.length ? nextRows : [createEmptyRow()];
    });
  };

  return (
    <Card style={{ padding: 20 }}>
      <input name={name} type="hidden" value={serializeTimeThresholdRules(serializableRules)} />

      <CardHeader style={{ alignItems: "center", marginBottom: 16 }}>
        <div>
          <CardTitle style={{ margin: 0 }}>Progi przekroczenia czasu</CardTitle>
          <CardDescription>
            Maksymalnie {MAX_TIME_THRESHOLD_RULES} pozycje. Zdefiniuj zakres procentowy ponad limit i wiadomość dla uczestnika.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="wf-table-card" style={{ padding: 0, border: 0, boxShadow: "none" }}>
        <div className="wf-table-head" style={{ gridTemplateColumns: "0.55fr 0.55fr 1.5fr 0.25fr" }}>
          <span>Od %</span>
          <span>Do %</span>
          <span>Komunikat dla uczestnika</span>
          <span />
        </div>

        <div>
          {rows.map((row, index) => (
            <div
              className="wf-table-row"
              key={`threshold-row-${index}`}
              style={{ display: "grid", gridTemplateColumns: "0.55fr 0.55fr 1.5fr 0.25fr", gap: 12 }}
            >
              <Input
                min="0"
                onChange={(event) => updateRow(index, "minPercent", event.target.value)}
                placeholder="0"
                type="number"
                value={row.minPercent}
              />
              <Input
                min="0"
                onChange={(event) => updateRow(index, "maxPercent", event.target.value)}
                placeholder="25"
                type="number"
                value={row.maxPercent}
              />
              <Input
                onChange={(event) => updateRow(index, "message", event.target.value)}
                placeholder="np. Przekroczyłeś limit o niewiele - zrób krótką przerwę."
                type="text"
                value={row.message}
              />
              <Button
                aria-label={`Usuń próg ${index + 1}`}
                disabled={rows.length === 1}
                onClick={() => removeRow(index)}
                type="button"
                variant="destructive"
                size="icon"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {rows.length < MAX_TIME_THRESHOLD_RULES ? (
        <div className="wf-card-actions" style={{ marginTop: 12 }}>
          <Button onClick={() => setRows((current) => [...current, createEmptyRow()])} type="button" variant="secondary">
            <Plus size={18} />
            Dodaj wiersz
          </Button>
        </div>
      ) : null}
    </Card>
  );
};
