import { getTableColumns, inArray } from 'drizzle-orm';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';

import migrations from '../../../drizzle/migrations';

import { backupTables, fromPortableRow, toPortableRow, type BackupData, type BackupTable } from './format';

/** Number of migrations this app has; stamped into backups so newer ones are refused. */
export const SCHEMA_VERSION = migrations.journal.entries.length;

const tables = {
  collections: schema.collections,
  books: schema.books,
  notes: schema.notes,
  tags: schema.tags,
  noteTags: schema.noteTags,
  templates: schema.templates,
  notePhotos: schema.notePhotos,
  settings: schema.settings,
} as const;

/** Everything in the library, ready to write to a backup. */
export async function readAllData(db: Database): Promise<BackupData> {
  const data = {} as BackupData;
  for (const name of backupTables) {
    const rows = await db.select().from(tables[name]);
    data[name] = rows.map(toPortableRow);
  }
  return data;
}

export type RestoreMode = 'replace' | 'merge';

/** Only the columns each table has, so a backup from an older app version still inserts. */
function clean(name: BackupTable, row: Record<string, unknown>): Record<string, unknown> {
  const columns = Object.keys(getTableColumns(tables[name]));
  const out: Record<string, unknown> = {};
  for (const key of columns) if (key in row) out[key] = row[key];
  return out;
}

/**
 * Restores a backup in one transaction, so a failure leaves the library as it was.
 * - replace: the library becomes exactly the backup.
 * - merge: adds what isn't here yet (matched by id); nothing already here changes.
 *   Settings are left alone when merging.
 */
export async function restoreData(db: Database, data: BackupData, mode: RestoreMode): Promise<void> {
  const rows = (name: BackupTable) => data[name].map((r) => clean(name, fromPortableRow(r)));
  // Merging: a backup tag named like one already here (any case) joins that tag.
  const tagIdFor = new Map<string, string>();
  if (mode === 'merge') {
    const existing = new Map(
      (await db.select({ id: schema.tags.id, name: schema.tags.name }).from(schema.tags)).map((t) => [t.name.toLowerCase(), t.id]),
    );
    for (const t of data.tags) {
      const match = existing.get(String(t.name).toLowerCase());
      if (match && match !== t.id) tagIdFor.set(String(t.id), match);
    }
  }
  const noteTagRows = rows('noteTags').map((r) => ({ ...r, tagId: tagIdFor.get(String(r.tagId)) ?? r.tagId }));
  db.transaction((tx) => {
    if (mode === 'replace') {
      // Children first. Deleting collections cascades, but be explicit.
      tx.delete(schema.noteTags).run();
      tx.delete(schema.notePhotos).run();
      tx.delete(schema.notes).run();
      tx.delete(schema.tags).run();
      tx.delete(schema.templates).run();
      tx.delete(schema.books).run();
      tx.delete(schema.collections).run();
      tx.delete(schema.settings).run();
    }
    const insert = (name: BackupTable, values: Record<string, unknown>[]) => {
      // Batches stay well under SQLite's limit on bound values.
      for (let i = 0; i < values.length; i += 50) {
        tx.insert(tables[name])
          .values(values.slice(i, i + 50) as never)
          .onConflictDoNothing()
          .run();
      }
    };
    insert('collections', rows('collections'));
    insert('books', rows('books'));
    insert('notes', rows('notes'));
    insert('tags', rows('tags').filter((t) => !tagIdFor.has(String(t.id))));
    insert('noteTags', noteTagRows);
    insert('templates', rows('templates'));
    insert('notePhotos', rows('notePhotos'));
    if (mode === 'replace') insert('settings', rows('settings'));
  });
}

/** Ids from a backup already in the library, to say how many a merge will skip. */
export async function countExisting(db: Database, data: BackupData): Promise<number> {
  let found = 0;
  for (const name of ['collections', 'books', 'notes'] as const) {
    const ids = data[name].map((r) => String(r.id));
    for (let i = 0; i < ids.length; i += 200) {
      const table = tables[name];
      const rows = await db.select({ id: table.id }).from(table).where(inArray(table.id, ids.slice(i, i + 200)));
      found += rows.length;
    }
  }
  return found;
}
