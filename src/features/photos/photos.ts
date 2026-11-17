/** Photo rows in the database. Files on disk are handled by `storage.ts`. */
import { asc, eq, max } from 'drizzle-orm';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';
import type { NotePhoto } from '@/db/schema';
import { newId } from '@/lib/id';

export interface ImportedPhoto {
  fileName: string;
  width: number;
  height: number;
}

/** Adds photos to the end of a note's photos. Returns the new row ids. */
export async function addPhotos(db: Database, noteId: string, photos: ImportedPhoto[]): Promise<string[]> {
  if (!photos.length) return [];
  const p = schema.notePhotos;
  const [row] = await db.select({ last: max(p.position) }).from(p).where(eq(p.noteId, noteId));
  const start = (row?.last ?? -1) + 1;
  const ids = photos.map(() => newId());
  await db.insert(p).values(photos.map((photo, i) => ({ id: ids[i], noteId, position: start + i, ...photo })));
  await db.update(schema.notes).set({ updatedAt: new Date() }).where(eq(schema.notes.id, noteId));
  return ids;
}

/** Removes one photo from its note. The file goes once no note uses it (see `cleanup.ts`). */
export async function removePhoto(db: Database, photoId: string): Promise<void> {
  await db.delete(schema.notePhotos).where(eq(schema.notePhotos.id, photoId));
}

export async function listNotePhotos(db: Database, noteId: string): Promise<NotePhoto[]> {
  const p = schema.notePhotos;
  return db.select().from(p).where(eq(p.noteId, noteId)).orderBy(asc(p.position));
}

/** Every photo file name the database knows about (Recently deleted notes included). */
export async function allPhotoFiles(db: Database): Promise<Set<string>> {
  const rows = await db.select({ fileName: schema.notePhotos.fileName }).from(schema.notePhotos);
  return new Set(rows.map((r) => r.fileName));
}
