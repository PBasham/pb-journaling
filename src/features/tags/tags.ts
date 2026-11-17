import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';
import type { Tag } from '@/db/schema';
import { newId } from '@/lib/id';
import type { ItemColor } from '@/theme/tokens';

const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ').replace(/^#/, '');

export async function listTags(db: Database): Promise<Tag[]> {
  return db.select().from(schema.tags).orderBy(asc(sql`lower(${schema.tags.name})`));
}

export type TagWithCount = Tag & { count: number };

/** Tags with how many notes (not in Recently deleted) use each. */
export async function listTagsWithCounts(db: Database): Promise<TagWithCount[]> {
  const rows = await db
    .select({
      tag: schema.tags,
      count: sql<number>`(select count(*) from "note_tags" nt join "notes" n on n."id" = nt."note_id"
        where nt."tag_id" = "tags"."id" and n."deleted_at" is null)`,
    })
    .from(schema.tags)
    .orderBy(asc(sql`lower(${schema.tags.name})`));
  return rows.map((r) => ({ ...r.tag, count: Number(r.count) }));
}

/** The tag with this name (any case), made if it doesn't exist yet. */
export async function findOrCreateTag(db: Database, name: string, color: ItemColor = 'slate'): Promise<Tag> {
  const clean = cleanName(name);
  if (!clean) throw new Error('A tag needs a name.');
  const existing = await db
    .select()
    .from(schema.tags)
    .where(sql`lower(${schema.tags.name}) = lower(${clean})`);
  if (existing[0]) return existing[0];
  const now = new Date();
  const tag = { id: newId(), name: clean, color, createdAt: now, updatedAt: now };
  await db.insert(schema.tags).values(tag);
  return tag;
}

/** Renames or recolors a tag. Renaming to another tag's name merges them. */
export async function updateTag(db: Database, id: string, patch: { name?: string; color?: ItemColor }): Promise<void> {
  if (patch.name !== undefined) {
    const clean = cleanName(patch.name);
    if (!clean) return;
    const other = (
      await db
        .select()
        .from(schema.tags)
        .where(sql`lower(${schema.tags.name}) = lower(${clean}) and ${schema.tags.id} != ${id}`)
    )[0];
    if (other) {
      db.transaction((tx) => {
        tx.run(sql`insert or ignore into ${schema.noteTags} (note_id, tag_id)
          select note_id, ${other.id} from ${schema.noteTags} where tag_id = ${id}`);
        tx.delete(schema.tags).where(eq(schema.tags.id, id)).run();
      });
      return;
    }
    await db.update(schema.tags).set({ name: clean, updatedAt: new Date() }).where(eq(schema.tags.id, id));
  }
  if (patch.color !== undefined) {
    await db.update(schema.tags).set({ color: patch.color, updatedAt: new Date() }).where(eq(schema.tags.id, id));
  }
}

/** Deletes a tag. Notes keep everything else. */
export async function deleteTag(db: Database, id: string): Promise<void> {
  await db.delete(schema.tags).where(eq(schema.tags.id, id));
}

export async function getNoteTags(db: Database, noteId: string): Promise<Tag[]> {
  const rows = await db
    .select({ tag: schema.tags })
    .from(schema.noteTags)
    .innerJoin(schema.tags, eq(schema.noteTags.tagId, schema.tags.id))
    .where(eq(schema.noteTags.noteId, noteId))
    .orderBy(asc(sql`lower(${schema.tags.name})`));
  return rows.map((r) => r.tag);
}

/** Replaces a note's tags. */
export async function setNoteTags(db: Database, noteId: string, tagIds: string[]): Promise<void> {
  const unique = [...new Set(tagIds)];
  db.transaction((tx) => {
    tx.delete(schema.noteTags).where(eq(schema.noteTags.noteId, noteId)).run();
    if (unique.length) tx.insert(schema.noteTags).values(unique.map((tagId) => ({ noteId, tagId }))).run();
  });
}

/** Ids of notes with a tag. */
export async function noteIdsWithTag(db: Database, tagId: string): Promise<string[]> {
  const rows = await db.select({ id: schema.noteTags.noteId }).from(schema.noteTags).where(eq(schema.noteTags.tagId, tagId));
  return rows.map((r) => r.id);
}

/** Tags for many notes at once: note id to its tags. */
export async function tagsForNotes(db: Database, noteIds: string[]): Promise<Map<string, Tag[]>> {
  const out = new Map<string, Tag[]>();
  if (!noteIds.length) return out;
  const rows = await db
    .select({ noteId: schema.noteTags.noteId, tag: schema.tags })
    .from(schema.noteTags)
    .innerJoin(schema.tags, eq(schema.noteTags.tagId, schema.tags.id))
    .where(and(inArray(schema.noteTags.noteId, noteIds)))
    .orderBy(asc(sql`lower(${schema.tags.name})`));
  for (const r of rows) out.set(r.noteId, [...(out.get(r.noteId) ?? []), r.tag]);
  return out;
}
