import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { runMigrations } from "./migrations";

type DbGlobal = typeof globalThis & {
  __daftarSetareDb?: DatabaseSync;
};

const globalForDb = globalThis as DbGlobal;

export function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim() || "./.data/daftar-setareh.db";
  if (configured === ":memory:") return configured;
  return isAbsolute(configured)
    ? configured
    : resolve(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function openDatabase(path = resolveDatabasePath()): DatabaseSync {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  if (path !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
  }
  runMigrations(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__daftarSetareDb) {
    globalForDb.__daftarSetareDb = openDatabase();
  }
  return globalForDb.__daftarSetareDb;
}

export function setDatabaseForTests(db: DatabaseSync | undefined): void {
  globalForDb.__daftarSetareDb = db;
}

export function closeDatabase(): void {
  if (globalForDb.__daftarSetareDb) {
    try {
      globalForDb.__daftarSetareDb.close();
    } catch {
      // اتصال ممکن است قبلاً بسته شده باشد.
    }
    globalForDb.__daftarSetareDb = undefined;
  }
}

export type SqlParams = SQLInputValue[];

export function all<T>(sql: string, params: SqlParams = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function one<T>(sql: string, params: SqlParams = []): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: SqlParams = []): {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
} {
  const result = getDb().prepare(sql).run(...params);
  return {
    changes: result.changes,
    lastInsertRowid: result.lastInsertRowid,
  };
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function toBoolean(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export function fromBoolean(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}

export function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}
