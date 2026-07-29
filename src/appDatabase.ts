//------------------------------------------------------------------------------
//Shared app-wide SQLite database (POI, categories, routes, saved user styles).
//Single file so every concern that used to be its own DB just gets a new
//table here instead of a new DB file per feature.
//------------------------------------------------------------------------------
import sqlite3 from "../DB/sqlite3-promise";
import Log from "./log";
import { LogModules } from "./enum";
import { existsSync, renameSync } from "fs";
import path from "path";
// In packaged builds main.ts points this at Electron's writable userData dir;
// falls back to cwd for `npm start` development.
const ExecFolder = process.env.MAPTORIUM_DATA_DIR || process.cwd();

export const APP_DB_NAME = path.join(ExecFolder, "app.db");

// Pre-rename filename: versions before the styles/app.db merge stored
// everything in POI.db3. Migrate it in place (same filesystem, instant even
// for a large DB) so existing POI/category/route data isn't lost.
const LEGACY_POI_DB_NAME = path.join(ExecFolder, "POI.db3");

const CREATE_TABLE_QUERIES = [
  "CREATE_DB_1",
  "CREATE_DB_2",
  "CREATE_DB_3",
  "CREATE_DB_4",
  "CREATE_DB_5",
  "CREATE_DB_6",
  "CREATE_DB_7",
];

let ensureAppDBPromise: Promise<boolean> | null = null;

async function migrateAndCreate(): Promise<boolean> {
  if (!existsSync(APP_DB_NAME) && existsSync(LEGACY_POI_DB_NAME)) {
    try {
      renameSync(LEGACY_POI_DB_NAME, APP_DB_NAME);
      Log.success(
        LogModules.poi,
        "Migrated legacy POI.db3 -> app.db (" + APP_DB_NAME + ")"
      );
    } catch (e) {
      Log.error(
        LogModules.poi,
        "Failed to migrate POI.db3 -> app.db: " + (e as Error)?.message
      );
    }
  }

  if (!(await sqlite3.open(APP_DB_NAME))) {
    Log.error(LogModules.poi, "Cant open app DB. Pls check location.");
    return false;
  }

  // Every table creation is idempotent (IF NOT EXISTS), so this is safe to
  // run on every startup regardless of whether app.db already existed - it's
  // also how a new table (e.g. "styles") gets added to a DB that was created
  // by an older build of the app.
  for (const key of CREATE_TABLE_QUERIES) {
    await sqlite3.run(APP_DB_NAME, key);
  }

  return true;
}

/**
 * Ensure the shared app DB exists (migrating the legacy POI.db3 name if
 * needed) and has every table this build expects. Safe to call from any
 * module's constructor - concurrent callers share the same in-flight promise.
 */
export function ensureAppDB(): Promise<boolean> {
  if (!ensureAppDBPromise) {
    ensureAppDBPromise = migrateAndCreate();
  }
  return ensureAppDBPromise;
}
