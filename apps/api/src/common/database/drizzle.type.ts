import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { relations } from './drizzle.relations.js';

export type DrizzleClient = NodePgDatabase<typeof relations>;
