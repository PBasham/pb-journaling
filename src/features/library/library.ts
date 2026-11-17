/**
 * Everything that reads or changes the library: collections, books, pages and notes.
 * Plain functions over the database, so they are tested against a real SQLite in Jest.
 */
import { and, asc, desc, eq, inArray, isNull, max, or, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';
import type { Book, Collection, Note } from '@/db/schema';
import { newId } from '@/lib/id';
import type { ItemColor } from '@/theme/tokens';

import { docToPlainText, type Doc } from '../editor/document';

// Sorting -------------------------------------------------------------------

export type SortField = 'updated' | 'created' | 'name';
export interface SortOrder {
  field: SortField;
  ascending: boolean;
}

export const defaultSort: SortOrder = { field: 'updated', ascending: false };

function orderBy(sort: SortOrder, columns: { name: SQLiteColumn; created: SQLiteColumn; updated: SQLiteColumn }): SQL[] {
  const dir = sort.ascending ? asc : desc;
  if (sort.field === 'name') return [dir(sql`lower(${columns.name})`), desc(columns.updated)];
  return [dir(sort.field === 'created' ? columns.created : columns.updated)];
}

// Where things live ---------------------------------------------------------

/** Where a book or loose note lives. `null` is the top level. */
export type Place = { collectionId: string | null };

/** Where a note can be: loose (in a collection or the top level) or a page in a book. */
export type NotePlace = { collectionId: string | null; bookId?: null } | { bookId: string; collectionId?: null };

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

// Collections ---------------------------------------------------------------

export interface CollectionInput {
  name: string;
  color: ItemColor;
}

export async function createCollection(db: Database, input: CollectionInput): Promise<string> {
  const id = newId();
  const now = new Date();
  await db.insert(schema.collections).values({
    id,
    name: cleanName(input.name) || 'Untitled collection',
    color: input.color,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateCollection(
  db: Database,
  id: string,
  patch: Partial<CollectionInput> & { isFavorite?: boolean; isLocked?: boolean },
): Promise<void> {
  await db
    .update(schema.collections)
    .set({
      ...(patch.isLocked !== undefined ? { isLocked: patch.isLocked } : {}),
      ...(patch.name !== undefined ? { name: cleanName(patch.name) || 'Untitled collection' } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.isFavorite !== undefined ? { isFavorite: patch.isFavorite } : {}),
      // Favoriting isn't an edit: it shouldn't jump the collection to the top of "Updated".
      ...(patch.name !== undefined || patch.color !== undefined ? { updatedAt: new Date() } : {}),
    })
    .where(eq(schema.collections.id, id));
}

export type CollectionDeleteMode = 'everything' | 'keepContents';

/**
 * Deletes a collection. `everything` removes its books, their pages and its notes too;
 * `keepContents` moves them to the top level first.
 */
export async function deleteCollection(db: Database, id: string, mode: CollectionDeleteMode): Promise<void> {
  db.transaction((tx) => {
    if (mode === 'keepContents') {
      tx.update(schema.books).set({ collectionId: null }).where(eq(schema.books.collectionId, id)).run();
      tx.update(schema.notes).set({ collectionId: null }).where(eq(schema.notes.collectionId, id)).run();
    }
    tx.delete(schema.collections).where(eq(schema.collections.id, id)).run();
  });
}

export async function getCollection(db: Database, id: string): Promise<Collection | undefined> {
  const rows = await db.select().from(schema.collections).where(eq(schema.collections.id, id));
  return rows[0];
}

export type CollectionWithCounts = Collection & { bookCount: number; noteCount: number };

export async function listCollections(db: Database, sort: SortOrder = defaultSort): Promise<CollectionWithCounts[]> {
  const c = schema.collections;
  // Table names are written out: Drizzle leaves column names unqualified, which a subquery would
  // read as its own table's columns.
  const rows = await db
    .select({
      collection: c,
      bookCount: sql<number>`(select count(*) from "books" b where b."collection_id" = "collections"."id")`,
      noteCount: sql<number>`(select count(*) from "notes" n where n."collection_id" = "collections"."id")`,
    })
    .from(c)
    .orderBy(...orderBy(sort, { name: c.name, created: c.createdAt, updated: c.updatedAt }));
  return rows.map((r) => ({ ...r.collection, bookCount: Number(r.bookCount), noteCount: Number(r.noteCount) }));
}

// Books ---------------------------------------------------------------------

export interface BookInput {
  name: string;
  color: ItemColor;
}

export async function createBook(db: Database, input: BookInput & Place): Promise<string> {
  const id = newId();
  const now = new Date();
  await db.insert(schema.books).values({
    id,
    collectionId: input.collectionId,
    name: cleanName(input.name) || 'Untitled book',
    color: input.color,
    createdAt: now,
    updatedAt: now,
  });
  await touchCollection(db, input.collectionId);
  return id;
}

export async function updateBook(
  db: Database,
  id: string,
  patch: Partial<BookInput> & { isFavorite?: boolean; isLocked?: boolean },
): Promise<void> {
  await db
    .update(schema.books)
    .set({
      ...(patch.isLocked !== undefined ? { isLocked: patch.isLocked } : {}),
      ...(patch.name !== undefined ? { name: cleanName(patch.name) || 'Untitled book' } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.isFavorite !== undefined ? { isFavorite: patch.isFavorite } : {}),
      ...(patch.name !== undefined || patch.color !== undefined ? { updatedAt: new Date() } : {}),
    })
    .where(eq(schema.books.id, id));
}

/** Moves a book (and so its pages) into a collection, or to the top level with `null`. */
export async function moveBook(db: Database, id: string, collectionId: string | null): Promise<void> {
  await db.update(schema.books).set({ collectionId, updatedAt: new Date() }).where(eq(schema.books.id, id));
  await touchCollection(db, collectionId);
}

/** Deletes a book and its pages. */
export async function deleteBook(db: Database, id: string): Promise<void> {
  await db.delete(schema.books).where(eq(schema.books.id, id));
}

export async function getBook(db: Database, id: string): Promise<Book | undefined> {
  const rows = await db.select().from(schema.books).where(eq(schema.books.id, id));
  return rows[0];
}

export type BookWithCounts = Book & { pageCount: number };

/** Books in a collection, or at the top level with `null`. */
export async function listBooks(db: Database, collectionId: string | null, sort: SortOrder = defaultSort): Promise<BookWithCounts[]> {
  const b = schema.books;
  const rows = await db
    .select({
      book: b,
      pageCount: sql<number>`(select count(*) from "notes" n where n."book_id" = "books"."id")`,
    })
    .from(b)
    .where(collectionId === null ? isNull(b.collectionId) : eq(b.collectionId, collectionId))
    .orderBy(...orderBy(sort, { name: b.name, created: b.createdAt, updated: b.updatedAt }));
  return rows.map((r) => ({ ...r.book, pageCount: Number(r.pageCount) }));
}

/** Every book with where it lives, for the "Move to" picker. */
export async function listAllBooks(db: Database): Promise<Book[]> {
  return db.select().from(schema.books).orderBy(sql`lower(${schema.books.name})`);
}

// Notes and pages -----------------------------------------------------------

export interface NoteInput {
  title?: string;
  doc?: Doc;
  color?: ItemColor;
}

async function nextPosition(db: Database, bookId: string): Promise<number> {
  const rows = await db.select({ top: max(schema.notes.position) }).from(schema.notes).where(eq(schema.notes.bookId, bookId));
  const top = rows[0]?.top;
  return top === null || top === undefined ? 1 : Number(top) + 1;
}

/** Creates a loose note, or a page at the end of a book. */
export async function createNote(db: Database, place: NotePlace, input: NoteInput = {}): Promise<string> {
  const id = newId();
  const now = new Date();
  const bookId = place.bookId ?? null;
  const doc = input.doc;
  await db.insert(schema.notes).values({
    id,
    bookId,
    collectionId: bookId ? null : (place.collectionId ?? null),
    position: bookId ? await nextPosition(db, bookId) : 0,
    title: input.title?.trim() ?? '',
    contentJson: doc ? JSON.stringify(doc) : '{}',
    contentText: doc ? docToPlainText(doc) : '',
    color: input.color ?? 'slate',
    createdAt: now,
    updatedAt: now,
  });
  await touchParents(db, { bookId, collectionId: bookId ? null : (place.collectionId ?? null) });
  return id;
}

export async function updateNote(
  db: Database,
  id: string,
  patch: NoteInput & { isFavorite?: boolean; isLocked?: boolean },
): Promise<void> {
  const edited = patch.title !== undefined || patch.doc !== undefined || patch.color !== undefined;
  await db
    .update(schema.notes)
    .set({
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.doc !== undefined
        ? { contentJson: JSON.stringify(patch.doc), contentText: docToPlainText(patch.doc) }
        : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.isFavorite !== undefined ? { isFavorite: patch.isFavorite } : {}),
      ...(patch.isLocked !== undefined ? { isLocked: patch.isLocked } : {}),
      ...(edited ? { updatedAt: new Date() } : {}),
    })
    .where(eq(schema.notes.id, id));
  if (edited) {
    const note = await getNote(db, id);
    if (note) await touchParents(db, note);
  }
}

/**
 * Moves a note: into a book (as its last page), into a collection, or to the top level.
 * A page moved out of its book becomes a loose note.
 */
export async function moveNote(db: Database, id: string, place: NotePlace): Promise<void> {
  const bookId = place.bookId ?? null;
  const collectionId = bookId ? null : (place.collectionId ?? null);
  const note = await getNote(db, id);
  if (!note) return;
  if (note.bookId === bookId && note.collectionId === collectionId) return;
  await db
    .update(schema.notes)
    .set({
      bookId,
      collectionId,
      position: bookId ? await nextPosition(db, bookId) : 0,
      updatedAt: new Date(),
    })
    .where(eq(schema.notes.id, id));
  await touchParents(db, { bookId, collectionId });
}

export async function deleteNote(db: Database, id: string): Promise<void> {
  await db.delete(schema.notes).where(eq(schema.notes.id, id));
}

export async function getNote(db: Database, id: string): Promise<Note | undefined> {
  const rows = await db.select().from(schema.notes).where(eq(schema.notes.id, id));
  return rows[0];
}

/** Loose notes in a collection, or at the top level with `null`. Pages are not included. */
export async function listNotes(db: Database, collectionId: string | null, sort: SortOrder = defaultSort): Promise<Note[]> {
  const n = schema.notes;
  return db
    .select()
    .from(n)
    .where(and(isNull(n.bookId), collectionId === null ? isNull(n.collectionId) : eq(n.collectionId, collectionId)))
    .orderBy(...orderBy(sort, { name: n.title, created: n.createdAt, updated: n.updatedAt }));
}

/** Pages of a book in order. */
export async function listPages(db: Database, bookId: string): Promise<Note[]> {
  return db
    .select()
    .from(schema.notes)
    .where(eq(schema.notes.bookId, bookId))
    .orderBy(asc(schema.notes.position), asc(schema.notes.createdAt));
}

/** Moves a page one step earlier (-1) or later (+1) in its book. */
export async function shiftPage(db: Database, id: string, step: -1 | 1): Promise<void> {
  const page = await getNote(db, id);
  if (!page?.bookId) return;
  const pages = await listPages(db, page.bookId);
  const index = pages.findIndex((p) => p.id === id);
  const target = index + step;
  if (index < 0 || target < 0 || target >= pages.length) return;
  const reordered = [...pages];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  // Renumber the whole book so positions stay simple whole numbers.
  db.transaction((tx) => {
    reordered.forEach((p, i) => {
      tx.update(schema.notes).set({ position: i + 1 }).where(eq(schema.notes.id, p.id)).run();
    });
  });
}

// Reordering ----------------------------------------------------------------

/** Puts a book's pages in the given order. Ids not in the book are ignored; missing ones go last. */
export async function reorderPages(db: Database, bookId: string, orderedIds: string[]): Promise<void> {
  const pages = await listPages(db, bookId);
  const known = new Set(pages.map((p) => p.id));
  const order = orderedIds.filter((id) => known.has(id));
  for (const p of pages) if (!order.includes(p.id)) order.push(p.id);
  db.transaction((tx) => {
    order.forEach((id, i) => {
      tx.update(schema.notes).set({ position: i + 1 }).where(eq(schema.notes.id, id)).run();
    });
  });
}

// Locks ---------------------------------------------------------------------

export type ItemKind = 'collection' | 'book' | 'note';

/**
 * The locked items guarding something: itself and whatever holds it (a note's book, the book's
 * collection). Empty when nothing on the way is locked. Opening the item needs all of these unlocked.
 */
export async function lockChain(db: Database, kind: ItemKind, id: string): Promise<string[]> {
  const locked: string[] = [];
  let collectionId: string | null = null;
  let bookId: string | null = null;
  if (kind === 'note') {
    const note = await getNote(db, id);
    if (!note) return locked;
    if (note.isLocked) locked.push(note.id);
    bookId = note.bookId;
    collectionId = note.collectionId;
  } else if (kind === 'book') {
    bookId = id;
  } else {
    collectionId = id;
  }
  if (bookId) {
    const book = await getBook(db, bookId);
    if (book?.isLocked) locked.push(book.id);
    collectionId = book?.collectionId ?? collectionId;
  }
  if (collectionId) {
    const collection = await getCollection(db, collectionId);
    if (collection?.isLocked) locked.push(collection.id);
  }
  return locked;
}

/** How many items are locked. */
export async function countLocked(db: Database): Promise<number> {
  const count = async (table: typeof schema.collections | typeof schema.books | typeof schema.notes) => {
    const rows = await db.select({ n: sql<number>`count(*)` }).from(table).where(eq(table.isLocked, true));
    return Number(rows[0]?.n ?? 0);
  };
  return (await count(schema.collections)) + (await count(schema.books)) + (await count(schema.notes));
}

/** Unlocks every item, for when the PIN or password is removed. */
export async function clearAllLocks(db: Database): Promise<void> {
  db.transaction((tx) => {
    tx.update(schema.collections).set({ isLocked: false }).where(eq(schema.collections.isLocked, true)).run();
    tx.update(schema.books).set({ isLocked: false }).where(eq(schema.books.isLocked, true)).run();
    tx.update(schema.notes).set({ isLocked: false }).where(eq(schema.notes.isLocked, true)).run();
  });
}

// Search --------------------------------------------------------------------

/** A LIKE pattern matching `text` anywhere, with `%`, `_` and `\` taken literally. */
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export interface SearchResults {
  collections: Collection[];
  books: Book[];
  notes: (Note & { snippet: string })[];
}

/** A short piece of `text` around the first match, on one line. */
export function snippetAround(text: string, query: string, radius = 50): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const at = flat.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return flat.length > radius * 2 ? `${flat.slice(0, radius * 2).trimEnd()}…` : flat;
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + query.length + radius);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end).trim()}${end < flat.length ? '…' : ''}`;
}

/**
 * Finds collections, books and notes by name, title or text. Anything locked, or inside something
 * locked, is left out, so search never reveals what a lock hides.
 */
export async function searchLibrary(db: Database, query: string, limit = 50): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { collections: [], books: [], notes: [] };
  const pattern = likePattern(q);
  const like = (column: SQLiteColumn) => sql`${column} like ${pattern} escape '\\'`;

  const collections = await db
    .select()
    .from(schema.collections)
    .where(and(eq(schema.collections.isLocked, false), like(schema.collections.name)))
    .orderBy(sql`lower(${schema.collections.name})`)
    .limit(limit);

  const bookRows = await db
    .select({ book: schema.books })
    .from(schema.books)
    .leftJoin(schema.collections, eq(schema.books.collectionId, schema.collections.id))
    .where(
      and(
        eq(schema.books.isLocked, false),
        sql`coalesce(${schema.collections.isLocked}, 0) = 0`,
        like(schema.books.name),
      ),
    )
    .orderBy(sql`lower(${schema.books.name})`)
    .limit(limit);

  // A note's collection is its own, or its book's.
  const noteRows = await db
    .select({ note: schema.notes })
    .from(schema.notes)
    .leftJoin(schema.books, eq(schema.notes.bookId, schema.books.id))
    .leftJoin(
      schema.collections,
      sql`${schema.collections.id} = coalesce(${schema.notes.collectionId}, ${schema.books.collectionId})`,
    )
    .where(
      and(
        eq(schema.notes.isLocked, false),
        sql`coalesce(${schema.books.isLocked}, 0) = 0`,
        sql`coalesce(${schema.collections.isLocked}, 0) = 0`,
        or(like(schema.notes.title), like(schema.notes.contentText)),
      ),
    )
    .orderBy(desc(schema.notes.updatedAt))
    .limit(limit);

  return {
    collections,
    books: bookRows.map((r) => r.book),
    notes: noteRows.map(({ note }) => ({ ...note, snippet: snippetAround(note.contentText, q) })),
  };
}

// Favorites -----------------------------------------------------------------

export interface Favorites {
  collections: Collection[];
  books: Book[];
  notes: Note[];
}

export async function listFavorites(db: Database): Promise<Favorites> {
  const [collections, books, notes] = await Promise.all([
    db.select().from(schema.collections).where(eq(schema.collections.isFavorite, true)).orderBy(sql`lower(${schema.collections.name})`),
    db.select().from(schema.books).where(eq(schema.books.isFavorite, true)).orderBy(sql`lower(${schema.books.name})`),
    db.select().from(schema.notes).where(eq(schema.notes.isFavorite, true)).orderBy(desc(schema.notes.updatedAt)),
  ]);
  return { collections, books, notes };
}

// Updated times -------------------------------------------------------------

async function touchCollection(db: Database, collectionId: string | null | undefined): Promise<void> {
  if (!collectionId) return;
  await db.update(schema.collections).set({ updatedAt: new Date() }).where(eq(schema.collections.id, collectionId));
}

/** Writing in a note counts as updating the book and collection it sits in. */
async function touchParents(db: Database, place: { bookId: string | null; collectionId: string | null }): Promise<void> {
  const now = new Date();
  if (place.bookId) {
    await db.update(schema.books).set({ updatedAt: now }).where(eq(schema.books.id, place.bookId));
    const book = await getBook(db, place.bookId);
    await touchCollection(db, book?.collectionId);
  } else {
    await touchCollection(db, place.collectionId);
  }
}

// Undo ----------------------------------------------------------------------

export interface Snapshot {
  collections: Collection[];
  books: Book[];
  notes: Note[];
}

/** Everything a delete would remove, so it can be put back. */
export async function snapshotCollection(db: Database, id: string): Promise<Snapshot> {
  const collections = await db.select().from(schema.collections).where(eq(schema.collections.id, id));
  const books = await db.select().from(schema.books).where(eq(schema.books.collectionId, id));
  const bookIds = books.map((b) => b.id);
  const loose = await db.select().from(schema.notes).where(eq(schema.notes.collectionId, id));
  const pages = bookIds.length
    ? await db.select().from(schema.notes).where(inArray(schema.notes.bookId, bookIds))
    : [];
  return { collections, books, notes: [...loose, ...pages] };
}

export async function snapshotBook(db: Database, id: string): Promise<Snapshot> {
  const books = await db.select().from(schema.books).where(eq(schema.books.id, id));
  const notes = await db.select().from(schema.notes).where(eq(schema.notes.bookId, id));
  return { collections: [], books, notes };
}

export async function snapshotNote(db: Database, id: string): Promise<Snapshot> {
  const notes = await db.select().from(schema.notes).where(eq(schema.notes.id, id));
  return { collections: [], books: [], notes };
}

/**
 * Puts deleted rows back. Rows whose collection or book is gone too land at the top level,
 * so nothing is lost even if the parent was deleted in the meantime.
 */
export async function restoreSnapshot(db: Database, snap: Snapshot): Promise<void> {
  const existingCollections = new Set(
    (await db.select({ id: schema.collections.id }).from(schema.collections)).map((r) => r.id),
  );
  for (const c of snap.collections) existingCollections.add(c.id);
  const existingBooks = new Set((await db.select({ id: schema.books.id }).from(schema.books)).map((r) => r.id));
  for (const b of snap.books) existingBooks.add(b.id);

  db.transaction((tx) => {
    if (snap.collections.length) tx.insert(schema.collections).values(snap.collections).onConflictDoNothing().run();
    if (snap.books.length) {
      tx.insert(schema.books)
        .values(snap.books.map((b) => ({ ...b, collectionId: b.collectionId && existingCollections.has(b.collectionId) ? b.collectionId : null })))
        .onConflictDoNothing()
        .run();
    }
    if (snap.notes.length) {
      tx.insert(schema.notes)
        .values(
          snap.notes.map((n) => {
            if (n.bookId && !existingBooks.has(n.bookId)) return { ...n, bookId: null, collectionId: null };
            if (n.collectionId && !existingCollections.has(n.collectionId)) return { ...n, collectionId: null };
            return n;
          }),
        )
        .onConflictDoNothing()
        .run();
    }
  });
}

// Settings ------------------------------------------------------------------

export async function getSetting<T>(db: Database, key: string, fallback: T): Promise<T> {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  if (!rows[0]) return fallback;
  try {
    return JSON.parse(rows[0].value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(db: Database, key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await db
    .insert(schema.settings)
    .values({ key, value: json })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: json } });
}
