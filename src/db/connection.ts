import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Works for both serverless API routes (Next.js on Vercel) and
// long-running seed scripts. The Neon HTTP driver doesn't require
// persistent connections so there's no pool to manage.
export const db = drizzle(process.env.DATABASE_URL!, { schema });
