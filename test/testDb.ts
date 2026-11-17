/// <reference types="node" />
/**
 * In-memory SQLite database for tests, built from the real migrations.
 * Uses sql.js (SQLite compiled to WebAssembly) so installing needs no native build tools.
 * Drizzle's sql.js driver is synchronous, like the Expo driver the app uses.
 */
import { drizzle } from 'drizzle-orm/sql-js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SqlJsStatic } from 'sql.js';

import type { Database as AppDatabase } from '@/db/client';
import * as schema from '@/db/schema';

declare global {
  // Loaded once per test file by test/setupSqlJs.ts.
  var __SQL__: SqlJsStatic | undefined;
}

const migrations = (() => {
  const dir = join(__dirname, '..', 'drizzle');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .flatMap((file) => readFileSync(join(dir, file), 'utf8').split('--> statement-breakpoint'))
    .filter((statement) => statement.trim());
})();

export function createTestDb(): AppDatabase {
  const SQL = globalThis.__SQL__;
  if (!SQL) throw new Error('sql.js is not loaded; check setupFilesAfterEnv in the Jest config.');
  const sqlite = new SQL.Database();
  sqlite.exec('PRAGMA foreign_keys = ON;');
  for (const statement of migrations) sqlite.exec(statement);
  // Same query builder API as the Expo driver.
  return drizzle(sqlite, { schema }) as unknown as AppDatabase;
}
