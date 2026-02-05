import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Works for both serverless API routes (Next.js on Vercel) and
// long-running seed scripts. The Neon HTTP driver doesn't require
// persistent connections so there's no pool to manage.

type DbType = NeonHttpDatabase<typeof schema>;

let _db: DbType | null = null;
let _initialized = false;

function initDb(): DbType | null {
  if (_initialized) return _db;
  _initialized = true;

  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  _db = drizzle(url, { schema });
  return _db;
}

export function isDatabaseConfigured(): boolean {
  return initDb() !== null;
}

/**
 * Get the database connection. Throws if DATABASE_URL is not configured.
 * Use isDatabaseConfigured() to check first if you need graceful handling.
 */
export function getDb(): DbType {
  const db = initDb();
  if (!db) {
    throw new Error('DATABASE_URL is not configured');
  }
  return db;
}

// For backward compatibility with seed scripts that use `db` directly
export const db = initDb();
