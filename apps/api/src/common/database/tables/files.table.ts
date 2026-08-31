import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { bigint, check, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { timestampz } from '../drizzle.utils.js';
import { users } from './users.table.js';

export const fileStatuses = ['pending', 'ready', 'failed', 'deleted'] as const;
export type FileStatus = (typeof fileStatuses)[number];

export const fileVisibilities = ['public', 'private'] as const;
export type FileVisibility = (typeof fileVisibilities)[number];

export const files = pgTable(
  'files',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    key: text('key').notNull(),
    bucket: text('bucket').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }),
    checksum: text('checksum'),
    originalFilename: text('original_filename').notNull(),
    maxByteSize: bigint('max_byte_size', { mode: 'number' }).notNull(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    visibility: text('visibility').$type<FileVisibility>().notNull(),
    status: text('status').$type<FileStatus>().notNull().default('pending'),
    createdAt: timestampz('created_at').notNull().defaultNow(),
    updatedAt: timestampz('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('files_bucket_key_idx').on(table.bucket, table.key),
    index('files_owner_id_idx').on(table.ownerId),
    index('files_status_created_at_idx').on(table.status, table.createdAt),
    check('files_status_check', sql`${table.status} in ('pending', 'ready', 'failed', 'deleted')`),
    check('files_visibility_check', sql`${table.visibility} in ('public', 'private')`),
  ],
);
