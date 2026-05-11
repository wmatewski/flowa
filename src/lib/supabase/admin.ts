import "server-only";

import type { QueryResult } from "pg";

import { getNeonPool } from "@/lib/neon";

type SupabaseLikeResult<T> = {
  data: T;
  error: Error | null;
  count: number | null;
};

type Operation = "select" | "insert" | "update" | "delete";

const flowaSchema = "flowa";

const isSafeIdentifier = (value: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);

const quoteIdentifier = (value: string) => {
  if (!isSafeIdentifier(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }

  return `"${value}"`;
};

const splitColumns = (value: string) =>
  value
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

class QueryBuilder<T = unknown>
  implements PromiseLike<SupabaseLikeResult<T>>
{
  private operation: Operation = "select";

  private selectedColumns = "*";

  private head = false;

  private countMode: "exact" | null = null;

  private insertPayload: Record<string, unknown>[] = [];

  private updatePayload: Record<string, unknown> = {};

  private onConflictColumns: string[] = [];

  private filters: string[] = [];

  private values: unknown[] = [];

  private orderBy: string | null = null;

  private limitValue: number | null = null;

  private expectSingle = false;

  private expectMaybeSingle = false;

  public constructor(private readonly table: string) {}

  public select(columns: string, options?: { count?: "exact"; head?: boolean }) {
    if (this.operation === "delete") {
      this.operation = "select";
    }
    this.selectedColumns = columns;
    this.countMode = options?.count ?? null;
    this.head = options?.head ?? false;
    return this;
  }

  public insert(payload: Record<string, unknown> | Array<Record<string, unknown>>) {
    this.operation = "insert";
    this.insertPayload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  public upsert(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    options: { onConflict: string },
  ) {
    this.operation = "insert";
    this.insertPayload = Array.isArray(payload) ? payload : [payload];
    this.onConflictColumns = splitColumns(options.onConflict);
    return this;
  }

  public update(payload: Record<string, unknown>) {
    this.operation = "update";
    this.updatePayload = payload;
    return this;
  }

  public delete() {
    this.operation = "delete";
    return this;
  }

  public eq(column: string, value: unknown) {
    this.pushFilter(`${quoteIdentifier(column)} = $${this.values.length + 1}`, value);
    return this;
  }

  public neq(column: string, value: unknown) {
    this.pushFilter(`${quoteIdentifier(column)} <> $${this.values.length + 1}`, value);
    return this;
  }

  public is(column: string, value: unknown) {
    if (value === null) {
      this.filters.push(`${quoteIdentifier(column)} IS NULL`);
      return this;
    }

    this.pushFilter(`${quoteIdentifier(column)} IS NOT DISTINCT FROM $${this.values.length + 1}`, value);
    return this;
  }

  public in(column: string, values: unknown[]) {
    if (!values.length) {
      this.filters.push("1=0");
      return this;
    }

    const params = values.map((value) => {
      this.values.push(value);
      return `$${this.values.length}`;
    });

    this.filters.push(`${quoteIdentifier(column)} IN (${params.join(", ")})`);
    return this;
  }

  public ilike(column: string, pattern: string) {
    this.pushFilter(`${quoteIdentifier(column)} ILIKE $${this.values.length + 1}`, pattern);
    return this;
  }

  public order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = `${quoteIdentifier(column)} ${options?.ascending === false ? "DESC" : "ASC"}`;
    return this;
  }

  public limit(value: number) {
    this.limitValue = value;
    return this;
  }

  public single(): Promise<SupabaseLikeResult<T>> {
    this.expectSingle = true;
    return this.execute();
  }

  public maybeSingle(): Promise<SupabaseLikeResult<T>> {
    this.expectMaybeSingle = true;
    return this.execute();
  }

  public then<TResult1 = SupabaseLikeResult<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: SupabaseLikeResult<T>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined);
  }

  private pushFilter(clause: string, value: unknown) {
    this.filters.push(clause);
    this.values.push(value);
  }

  private selectList() {
    const columns = splitColumns(this.selectedColumns);

    if (!columns.length || this.selectedColumns === "*") {
      return "*";
    }

    return columns.map((column) => quoteIdentifier(column)).join(", ");
  }

  private whereClause() {
    if (!this.filters.length) {
      return "";
    }

    return ` WHERE ${this.filters.join(" AND ")}`;
  }

  private baseTable() {
    return `${quoteIdentifier(flowaSchema)}.${quoteIdentifier(this.table)}`;
  }

  private async execute() {
    try {
      const result = await this.run();
      return {
        data: result as T,
        error: null,
        count: this.countMode === "exact" ? this.extractCount(result) : null,
      } satisfies SupabaseLikeResult<T>;
    } catch (error) {
      return {
        data: null as T,
        error: error instanceof Error ? error : new Error("Database query failed"),
        count: null,
      } satisfies SupabaseLikeResult<T>;
    }
  }

  private extractCount(result: unknown) {
    if (typeof result === "number") {
      return result;
    }

    if (Array.isArray(result)) {
      return result.length;
    }

    return null;
  }

  private async run() {
    if (this.operation === "select") {
      return this.runSelect();
    }

    if (this.operation === "insert") {
      return this.runInsert();
    }

    if (this.operation === "update") {
      return this.runUpdate();
    }

    return this.runDelete();
  }

  private async runSelect() {
    const table = this.baseTable();

    if (this.head && this.countMode === "exact") {
      const sqlText = `SELECT COUNT(*)::int AS count FROM ${table}${this.whereClause()}`;
      const result = await this.query(sqlText, this.values);
      return Number(result.rows[0]?.count ?? 0);
    }

    let sqlText = `SELECT ${this.selectList()} FROM ${table}${this.whereClause()}`;

    if (this.orderBy) {
      sqlText += ` ORDER BY ${this.orderBy}`;
    }

    if (this.limitValue != null) {
      sqlText += ` LIMIT ${Math.max(this.limitValue, 0)}`;
    }

    const result = await this.query(sqlText, this.values);
    return this.pickRows(result.rows);
  }

  private async runInsert() {
    if (!this.insertPayload.length) {
      return this.pickRows([]);
    }

    const table = this.baseTable();
    const columns = Object.keys(this.insertPayload[0] ?? {});

    if (!columns.length) {
      throw new Error("Insert payload must include at least one column");
    }

    const quotedColumns = columns.map((column) => quoteIdentifier(column)).join(", ");
    const values: unknown[] = [];

    const rowsSql = this.insertPayload
      .map((row) => {
        const placeholders = columns.map((column) => {
          values.push(row[column] ?? null);
          return `$${values.length}`;
        });

        return `(${placeholders.join(", ")})`;
      })
      .join(", ");

    let sqlText = `INSERT INTO ${table} (${quotedColumns}) VALUES ${rowsSql}`;

    if (this.onConflictColumns.length) {
      const conflict = this.onConflictColumns.map((column) => quoteIdentifier(column)).join(", ");
      const updates = columns
        .map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
        .join(", ");
      sqlText += ` ON CONFLICT (${conflict}) DO UPDATE SET ${updates}`;
    }

    if (this.selectedColumns !== "*" || this.expectSingle || this.expectMaybeSingle) {
      sqlText += ` RETURNING ${this.selectList()}`;
      const result = await this.query(sqlText, values);
      return this.pickRows(result.rows);
    }

    await this.query(sqlText, values);
    return null;
  }

  private async runUpdate() {
    const table = this.baseTable();
    const entries = Object.entries(this.updatePayload);

    if (!entries.length) {
      throw new Error("Update payload is empty");
    }

    const values = [...this.values];
    const setClause = entries
      .map(([column, value]) => {
        values.push(value ?? null);
        return `${quoteIdentifier(column)} = $${values.length}`;
      })
      .join(", ");

    let sqlText = `UPDATE ${table} SET ${setClause}${this.whereClause()}`;

    if (this.selectedColumns !== "*" || this.expectSingle || this.expectMaybeSingle) {
      sqlText += ` RETURNING ${this.selectList()}`;
      const result = await this.query(sqlText, values);
      return this.pickRows(result.rows);
    }

    await this.query(sqlText, values);
    return null;
  }

  private async runDelete() {
    const table = this.baseTable();
    const sqlText = `DELETE FROM ${table}${this.whereClause()}`;
    await this.query(sqlText, this.values);
    return null;
  }

  private pickRows(rows: unknown[]) {
    if (this.expectSingle) {
      if (rows.length !== 1) {
        throw new Error("Expected exactly one row");
      }

      return rows[0] ?? null;
    }

    if (this.expectMaybeSingle) {
      if (rows.length > 1) {
        throw new Error("Expected zero or one row");
      }

      return rows[0] ?? null;
    }

    return rows;
  }

  private async query(sqlText: string, params: unknown[]): Promise<QueryResult<Record<string, unknown>>> {
    const pool = getNeonPool();
    return pool.query(sqlText, params);
  }
}

export const createSupabaseAdminClient = (): any => ({
  from: <T = unknown>(table: string) => new QueryBuilder<T>(table),
});