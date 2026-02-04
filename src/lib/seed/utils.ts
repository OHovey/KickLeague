/**
 * Shared utilities for seed modules.
 *
 * - buildConflictUpdateColumns: Drizzle upsert helper
 * - chunk: split arrays for batch API calls
 * - formatProgress: human-readable progress logging
 * - delay: simple sleep for rate-limit display
 */

import { getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * Build a `set` record for `onConflictDoUpdate` that maps each given
 * column to `excluded.{column_name}`.
 *
 * Usage:
 * ```ts
 * db.insert(teams).values(rows).onConflictDoUpdate({
 *   target: teams.apiId,
 *   set: buildConflictUpdateColumns(teams, ['name', 'logoUrl', 'stadiumName']),
 * });
 * ```
 */
export function buildConflictUpdateColumns<
  T extends PgTable,
  C extends keyof T["_"]["columns"] & string,
>(table: T, columns: C[]): Record<C, ReturnType<typeof sql>> {
  const tableColumns = getTableColumns(table);
  return columns.reduce(
    (acc, col) => {
      const column = tableColumns[col];
      if (!column) {
        throw new Error(
          `Column "${col}" not found in table. Available: ${Object.keys(tableColumns).join(", ")}`,
        );
      }
      // Use the actual database column name (snake_case) for the excluded reference
      acc[col] = sql.raw(`excluded.${column.name}`);
      return acc;
    },
    {} as Record<C, ReturnType<typeof sql>>,
  );
}

/**
 * Split an array into chunks of a given size.
 * Used for batch fixture detail API calls (max 20 IDs per call).
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Format a progress message like "[15/96] Seeding teams..."
 */
export function formatProgress(
  current: number,
  total: number,
  label: string,
): string {
  return `[${current}/${total}] ${label}`;
}

/**
 * Simple delay helper for rate-limit display pauses.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
