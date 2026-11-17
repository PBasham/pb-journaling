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

/** Pinned items first, then the chosen order. */
function orderBy(
  sort: SortOrder,
  columns: { pinned: SQLiteColumn; name: SQLiteColumn; created: SQLiteColumn; updated: SQLiteColumn },
): SQL[] {
  const dir = sort.ascending ? asc : desc;
  const pinnedFirst = desc(columns.pinned);
  if (sort.field === 'name') return [pinnedFirst, dir(sql`lower(${columns.name})`), desc(columns.updated)];
  return [pinnedFirst, dir(sort.field === 'created' ? columns.created : columns.updated)];
}

/** Not in Recently deleted. */
const live = (table: { deletedAt: SQLiteColumn }) => isNull(table.deletedAt);

/** How long deleted items stay in Recently deleted. */
export const TRASH_DAYS = 30;

/** Flags any collection, book or note can change without counting as an edit. */
export interface ItemFlags {
  isFavorite?: boolean;
  isLocked?: boolean;
  isPinned?: boolean;
}

function flags(patch: ItemFlags) {
  return {
    ...(patch.isFavorite !== undefined ? { isFavorite: patch.isFavorite } : {}),
    ...(patch.isLocked !== undefined ? { isLocked: patch.isLocked } : {}),
    ...(patch.isPinned !== undefined ? { isPinned: patch.isPinned } : {}),
  };
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
  patch: Partial<CollectionInput> & ItemFlags,
): Promise<void> {
  await db
    .update(schema.collections)
    .set({
      ...flags(patch),
      ...(patch.name !== undefined ? { name: cleanName(patch.name) || 'Untitled collection' } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      // Favoriting isn't an edit: it shouldn't jump the collection to the top of "Updated".
      ...(patch.name !== undefined || patch.color !== undefined ? { updatedAt: new Date() } : {}),
    })
    .where(eq(schema.collections.id, id));
}

export type CollectionDeleteMode = 'everything' | 'keepContents';

/**
 * Moves a collection to Recently deleted. `everything` takes its books, their pages and its notes
 * along (deleted at the same moment, so they come back together); `keepContents` moves them to
 * the top level first.
 */
export async function deleteCollection(db: Database, id: string, mode: CollectionDeleteMode): Promise<void> {
  const at = new Date();
  const bookIds = (
    await db
      .select({ id: schema.books.id })
      .from(schema.books)
      .where(and(eq(schema.books.collectionId, id), live(schema.books)))
  ).map((b) => b.id);
  db.transaction((tx) => {
    if (mode === 'keepContents') {
      tx.update(schema.books).set({ collectionId: null }).where(and(eq(schema.books.collectionId, id), live(schema.books))).run();
      tx.update(schema.notes).set({ collectionId: null }).where(and(eq(schema.notes.collectionId, id), live(schema.notes))).run();
    } else {
      tx.update(schema.books).set({ deletedAt: at }).where(and(eq(schema.books.collectionId, id), live(schema.books))).run();
      tx.update(schema.notes).set({ deletedAt: at }).where(and(eq(schema.notes.collectionId, id), live(schema.notes))).run();
      if (bookIds.length) {
        tx.update(schema.notes).set({ deletedAt: at }).where(and(inArray(schema.notes.bookId, bookIds), live(schema.notes))).run();
      }
    }
    tx.update(schema.collections).set({ deletedAt: at }).where(eq(schema.collections.id, id)).run();
  });
}

/** A collection, unless it's gone or in Recently deleted. */
export async function getCollection(db: Database, id: string): Promise<Collection | undefined> {
  const rows = await db
    .select()
    .from(schema.collections)
    .where(and(eq(schema.collections.id, id), live(schema.collections)));
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
      bookCount: sql<number>`(select count(*) from "books" b where b."collection_id" = "collections"."id" and b."deleted_at" is null)`,
      noteCount: sql<number>`(select count(*) from "notes" n where n."collection_id" = "collections"."id" and n."deleted_at" is null)`,
    })
    .from(c)
    .where(live(c))
    .orderBy(...orderBy(sort, { pinned: c.isPinned, name: c.name, created: c.createdAt, updated: c.updatedAt }));
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
  patch: Partial<BookInput> & ItemFlags,
): Promise<void> {
  await db
    .update(schema.books)
    .set({
      ...flags(patch),
      ...(patch.name !== undefined ? { name: cleanName(patch.name) || 'Untitled book' } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.name !== undefined || patch.color !== undefined ? { updatedAt: new Date() } : {}),
    })
    .where(eq(schema.books.id, id));
}

/** Moves a book (and so its pages) into a collection, or to the top level with `null`. */
export async function moveBook(db: Database, id: string, collectionId: string | null): Promise<void> {
  await db.update(schema.books).set({ collectionId, updatedAt: new Date() }).where(eq(schema.books.id, id));
  await touchCollection(db, collectionId);
}

/** Moves a book and its pages to Recently deleted. */
export async function deleteBook(db: Database, id: string): Promise<void> {
  const at = new Date();
  db.transaction((tx) => {
    tx.update(schema.notes).set({ deletedAt: at }).where(and(eq(schema.notes.bookId, id), live(schema.notes))).run();
    tx.update(schema.books).set({ deletedAt: at }).where(eq(schema.books.id, id)).run();
  });
}

/** A book, unless it's gone or in Recently deleted. */
export async function getBook(db: Database, id: string): Promise<Book | undefined> {
  const rows = await db.select().from(schema.books).where(and(eq(schema.books.id, id), live(schema.books)));
  return rows[0];
}

export type BookWithCounts = Book & { pageCount: number };

/** Books in a collection, or at the top level with `null`. */
export async function listBooks(db: Database, collectionId: string | null, sort: SortOrder = defaultSort): Promise<BookWithCounts[]> {
  const b = schema.books;
  const rows = await db
    .select({
      book: b,
      pageCount: sql<number>`(select count(*) from "notes" n where n."book_id" = "books"."id" and n."deleted_at" is null)`,
    })
    .from(b)
    .where(and(live(b), collectionId === null ? isNull(b.collectionId) : eq(b.collectionId, collectionId)))
    .orderBy(...orderBy(sort, { pinned: b.isPinned, name: b.name, created: b.createdAt, updated: b.updatedAt }));
  return rows.map((r) => ({ ...r.book, pageCount: Number(r.pageCount) }));
}

/** Every book with where it lives, for the "Move to" picker. */
export async function listAllBooks(db: Database): Promise<Book[]> {
  return db.select().from(schema.books).where(live(schema.books)).orderBy(sql`lower(${schema.books.name})`);
}

// Notes and pages -----------------------------------------------------------

export interface NoteInput {
  title?: string;
  doc?: Doc;
  color?: ItemColor;
}

async function nextPosition(db: Database, bookId: string): Promise<number> {
  const rows = await db
    .select({ top: max(schema.notes.position) })
    .from(schema.notes)
    .where(and(eq(schema.notes.bookId, bookId), live(schema.notes)));
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
  patch: NoteInput & ItemFlags,
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
      ...flags(patch),
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

/** Moves a note or page to Recently deleted. */
export async function deleteNote(db: Database, id: string): Promise<void> {
  await db.update(schema.notes).set({ deletedAt: new Date() }).where(eq(schema.notes.id, id));
}

/**
 * Removes a blank note made by mistake, skipping Recently deleted. A note with tags or photos isn't
 * blank, so it stays.
 */
export async function discardNote(db: Database, id: string): Promise<void> {
  const extras = await db.all<{ n: number }>(
    sql`select (select count(*) from "note_tags" where note_id = ${id}) + (select count(*) from "note_photos" where note_id = ${id}) as n`,
  );
  if (Number(extras[0]?.n ?? 0) > 0) return;
  await db.delete(schema.notes).where(eq(schema.notes.id, id));
}

/** A note, unless it's gone or in Recently deleted. */
export async function getNote(db: Database, id: string): Promise<Note | undefined> {
  const rows = await db.select().from(schema.notes).where(and(eq(schema.notes.id, id), live(schema.notes)));
  return rows[0];
}

/** Loose notes in a collection, or at the top level with `null`. Pages are not included. */
export async function listNotes(db: Database, collectionId: string | null, sort: SortOrder = defaultSort): Promise<Note[]> {
  const n = schema.notes;
  return db
    .select()
    .from(n)
    .where(and(live(n), isNull(n.bookId), collectionId === null ? isNull(n.collectionId) : eq(n.collectionId, collectionId)))
    .orderBy(...orderBy(sort, { pinned: n.isPinned, name: n.title, created: n.createdAt, updated: n.updatedAt }));
}

/** Pages of a book in order. */
export async function listPages(db: Database, bookId: string): Promise<Note[]> {
  return db
    .select()
    .from(schema.notes)
    .where(and(eq(schema.notes.bookId, bookId), live(schema.notes)))
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

// Bringing things in -------------------------------------------------------

export interface MoveCandidate {
  kind: 'book' | 'note';
  id: string;
  name: string;
  color: string;
  isLocked: boolean;
  /** Where it is now: "Library", a collection's name, or "Page in <book>". */
  where: string;
  isPage: boolean;
}

/**
 * What can be brought into a collection (books, loose notes and pages from elsewhere) or into a
 * book (loose notes and other books' pages, which become its pages). Newest first.
 */
export async function listMoveCandidates(db: Database, target: NotePlace): Promise<MoveCandidate[]> {
  const intoBook = target.bookId ?? null;
  const intoCollection = intoBook ? null : (target.collectionId ?? null);
  const collections = new Map(
    (await db.select().from(schema.collections).where(live(schema.collections))).map((c) => [c.id, c.name]),
  );
  const books = await db.select().from(schema.books).where(live(schema.books)).orderBy(desc(schema.books.updatedAt));
  const bookName = new Map(books.map((b) => [b.id, b.name]));
  const notes = await db.select().from(schema.notes).where(live(schema.notes)).orderBy(desc(schema.notes.updatedAt));
  const placeName = (collectionId: string | null) => (collectionId ? (collections.get(collectionId) ?? 'Library') : 'Library');

  const out: MoveCandidate[] = [];
  if (!intoBook) {
    for (const b of books) {
      if (b.collectionId === intoCollection) continue;
      out.push({ kind: 'book', id: b.id, name: b.name, color: b.color, isLocked: b.isLocked, where: placeName(b.collectionId), isPage: false });
    }
  }
  for (const n of notes) {
    if (intoBook && n.bookId === intoBook) continue;
    if (!intoBook && !n.bookId && n.collectionId === intoCollection) continue;
    // A page whose book has gone to Recently deleted isn't offered.
    if (n.bookId && !bookName.has(n.bookId)) continue;
    out.push({
      kind: 'note',
      id: n.id,
      name: n.title || 'Untitled',
      color: n.color,
      isLocked: n.isLocked,
      where: n.bookId ? `Page in ${bookName.get(n.bookId)}` : placeName(n.collectionId),
      isPage: !!n.bookId,
    });
  }
  return out;
}

/** Moves several books and notes into a collection, a book (as pages, in the given order) or the Library. */
export async function moveItemsInto(db: Database, target: NotePlace, items: { kind: 'book' | 'note'; id: string }[]): Promise<void> {
  const intoBook = target.bookId ?? null;
  for (const item of items) {
    if (item.kind === 'book') {
      // Books can't go inside books.
      if (!intoBook) await moveBook(db, item.id, target.collectionId ?? null);
    } else {
      await moveNote(db, item.id, target);
    }
  }
}

/**
 * Takes something out of where it is: a book or loose note leaves its collection for the Library;
 * a page leaves its book and becomes a loose note where the book is (its collection, or the Library).
 */
export async function takeOut(db: Database, kind: 'book' | 'note', id: string): Promise<void> {
  if (kind === 'book') {
    await moveBook(db, id, null);
    return;
  }
  const note = await getNote(db, id);
  if (!note) return;
  if (note.bookId) {
    const book = await getBook(db, note.bookId);
    await moveNote(db, id, { collectionId: book?.collectionId ?? null });
  } else {
    await moveNote(db, id, { collectionId: null });
  }
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
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(table)
      .where(and(eq(table.isLocked, true), live(table)));
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

function previewSnippet(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 100 ? `${flat.slice(0, 100).trimEnd()}…` : flat;
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
export async function searchLibrary(
  db: Database,
  query: string,
  options: { tagId?: string | null; limit?: number } = {},
): Promise<SearchResults> {
  const q = query.trim();
  const { tagId, limit = 50 } = options;
  if (!q && !tagId) return { collections: [], books: [], notes: [] };
  const pattern = likePattern(q);
  const like = (column: SQLiteColumn) => sql`${column} like ${pattern} escape '\\'`;
  const tagged = tagId
    ? sql`${schema.notes.id} in (select note_id from "note_tags" where tag_id = ${tagId})`
    : undefined;

  const collections = await db
    .select()
    .from(schema.collections)
    .where(
      and(
        live(schema.collections),
        eq(schema.collections.isLocked, false),
        q ? like(schema.collections.name) : undefined,
        tagId ? sql`${schema.collections.id} in (select collection_id from "collection_tags" where tag_id = ${tagId})` : undefined,
      ),
    )
    .orderBy(sql`lower(${schema.collections.name})`)
    .limit(limit);

  const bookRows = await db
    .select({ book: schema.books })
    .from(schema.books)
    .leftJoin(schema.collections, eq(schema.books.collectionId, schema.collections.id))
    .where(
      and(
        live(schema.books),
        eq(schema.books.isLocked, false),
        sql`coalesce(${schema.collections.isLocked}, 0) = 0`,
        q ? like(schema.books.name) : undefined,
        tagId ? sql`${schema.books.id} in (select book_id from "book_tags" where tag_id = ${tagId})` : undefined,
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
        live(schema.notes),
        eq(schema.notes.isLocked, false),
        sql`coalesce(${schema.books.isLocked}, 0) = 0`,
        sql`coalesce(${schema.collections.isLocked}, 0) = 0`,
        q ? or(like(schema.notes.title), like(schema.notes.contentText)) : undefined,
        tagged,
      ),
    )
    .orderBy(desc(schema.notes.updatedAt))
    .limit(limit);

  return {
    collections,
    books: bookRows.map((r) => r.book),
    notes: noteRows.map(({ note }) => ({ ...note, snippet: q ? snippetAround(note.contentText, q) : previewSnippet(note.contentText) })),
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
    db
      .select()
      .from(schema.collections)
      .where(and(eq(schema.collections.isFavorite, true), live(schema.collections)))
      .orderBy(sql`lower(${schema.collections.name})`),
    db
      .select()
      .from(schema.books)
      .where(and(eq(schema.books.isFavorite, true), live(schema.books)))
      .orderBy(sql`lower(${schema.books.name})`),
    db
      .select()
      .from(schema.notes)
      .where(and(eq(schema.notes.isFavorite, true), live(schema.notes)))
      .orderBy(desc(schema.notes.updatedAt)),
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

// Copies, stats and recently opened --------------------------------------

/** Copies a note (title gets " copy"), with its tags and photos, right after the original. */
export async function duplicateNote(db: Database, id: string): Promise<string | null> {
  const note = await getNote(db, id);
  if (!note) return null;
  const copyId = newId();
  const now = new Date();
  const position = note.bookId ? note.position + 0.5 : 0;
  await db.insert(schema.notes).values({
    ...note,
    id: copyId,
    title: note.title ? `${note.title} copy` : '',
    position,
    isPinned: false,
    isFavorite: false,
    lastOpenedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  await copyNoteExtras(db, id, copyId);
  if (note.bookId) await reorderPages(db, note.bookId, (await listPages(db, note.bookId)).map((p) => p.id));
  return copyId;
}

async function copyNoteExtras(db: Database, fromId: string, toId: string): Promise<void> {
  await db.run(sql`insert into ${schema.noteTags} (note_id, tag_id)
    select ${toId}, tag_id from ${schema.noteTags} where note_id = ${fromId}`);
  // Photo files are shared: a file is only removed once no note uses it.
  const photos = await db.select().from(schema.notePhotos).where(eq(schema.notePhotos.noteId, fromId));
  if (photos.length) {
    await db.insert(schema.notePhotos).values(photos.map((ph) => ({ ...ph, id: newId(), noteId: toId })));
  }
}

/** Copies a book with all its pages, in the same place. */
export async function duplicateBook(db: Database, id: string): Promise<string | null> {
  const book = await getBook(db, id);
  if (!book) return null;
  const copyId = newId();
  const now = new Date();
  await db.insert(schema.books).values({
    ...book,
    id: copyId,
    name: `${book.name} copy`,
    isPinned: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  });
  await db.run(sql`insert into ${schema.bookTags} (book_id, tag_id)
    select ${copyId}, tag_id from ${schema.bookTags} where book_id = ${id}`);
  for (const page of await listPages(db, id)) {
    const pageId = newId();
    await db.insert(schema.notes).values({ ...page, id: pageId, bookId: copyId, lastOpenedAt: null, createdAt: now, updatedAt: now });
    await copyNoteExtras(db, page.id, pageId);
  }
  return copyId;
}

export interface NoteStats {
  words: number;
  characters: number;
  /** Minutes to read at about 230 words a minute, at least 1 when there are words. */
  readingMinutes: number;
}

export function noteStats(text: string): NoteStats {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, characters: text.replace(/\s/g, '').length, readingMinutes: words ? Math.max(1, Math.round(words / 230)) : 0 };
}

/** Remembers that a note was just opened, for "Continue writing". Not an edit. */
export async function markOpened(db: Database, id: string): Promise<void> {
  await db.update(schema.notes).set({ lastOpenedAt: new Date() }).where(eq(schema.notes.id, id));
}

/** Notes opened most recently, newest first. */
export async function listRecentlyOpened(db: Database, limit = 6): Promise<Note[]> {
  return db
    .select()
    .from(schema.notes)
    .where(and(live(schema.notes), sql`${schema.notes.lastOpenedAt} is not null`))
    .orderBy(desc(schema.notes.lastOpenedAt))
    .limit(limit);
}

// Recently deleted -----------------------------------------------------------

export interface TrashItem {
  kind: ItemKind;
  id: string;
  name: string;
  color: string;
  isLocked: boolean;
  deletedAt: Date;
  /** "3 pages", "2 books · 1 note": what comes back with it. */
  contains: { books: number; pages: number; notes: number };
}

/**
 * What's in Recently deleted, newest first. Things deleted along with a collection or book are
 * listed under it, not on their own.
 */
export async function listTrash(db: Database): Promise<TrashItem[]> {
  const deleted = <T extends { deletedAt: SQLiteColumn }>(table: T) => sql`${table.deletedAt} is not null`;
  const collections = await db.select().from(schema.collections).where(deleted(schema.collections));
  const books = await db.select().from(schema.books).where(deleted(schema.books));
  const notes = await db.select().from(schema.notes).where(deleted(schema.notes));

  const at = (d: Date | null) => d?.getTime() ?? 0;
  const collectionAt = new Map(collections.map((c) => [c.id, at(c.deletedAt)]));
  const bookById = new Map(books.map((b) => [b.id, b]));
  const sameBatch = (parentAt: number | undefined, childAt: number) => parentAt !== undefined && parentAt === childAt;

  const items: TrashItem[] = [];
  for (const c of collections) {
    const t = at(c.deletedAt);
    const inBooks = books.filter((b) => b.collectionId === c.id && at(b.deletedAt) === t);
    const bookIds = new Set(inBooks.map((b) => b.id));
    items.push({
      kind: 'collection',
      id: c.id,
      name: c.name,
      color: c.color,
      isLocked: c.isLocked,
      deletedAt: c.deletedAt!,
      contains: {
        books: inBooks.length,
        pages: notes.filter((n) => n.bookId && bookIds.has(n.bookId) && at(n.deletedAt) === t).length,
        notes: notes.filter((n) => n.collectionId === c.id && at(n.deletedAt) === t).length,
      },
    });
  }
  for (const b of books) {
    const t = at(b.deletedAt);
    if (b.collectionId && sameBatch(collectionAt.get(b.collectionId), t)) continue;
    items.push({
      kind: 'book',
      id: b.id,
      name: b.name,
      color: b.color,
      isLocked: b.isLocked,
      deletedAt: b.deletedAt!,
      contains: { books: 0, pages: notes.filter((n) => n.bookId === b.id && at(n.deletedAt) === t).length, notes: 0 },
    });
  }
  for (const n of notes) {
    const t = at(n.deletedAt);
    const bookAt = n.bookId ? bookById.get(n.bookId)?.deletedAt : null;
    if (bookAt && at(bookAt) === t) continue;
    if (n.collectionId && sameBatch(collectionAt.get(n.collectionId), t)) continue;
    items.push({
      kind: 'note',
      id: n.id,
      name: n.title || 'Untitled',
      color: n.color,
      isLocked: n.isLocked,
      deletedAt: n.deletedAt!,
      contains: { books: 0, pages: 0, notes: 0 },
    });
  }
  return items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

/**
 * Brings something back from Recently deleted, with whatever was deleted along with it.
 * If what held it is gone (deleted separately, or for good), it comes back at the top level.
 */
export async function restoreDeleted(db: Database, kind: ItemKind, id: string): Promise<void> {
  const table = kind === 'collection' ? schema.collections : kind === 'book' ? schema.books : schema.notes;
  const rows = await db.select({ deletedAt: table.deletedAt }).from(table).where(eq(table.id, id));
  const at = rows[0]?.deletedAt;
  if (!at) return;

  const liveCollections = new Set(
    (await db.select({ id: schema.collections.id }).from(schema.collections).where(live(schema.collections))).map((r) => r.id),
  );
  const liveBooks = new Set((await db.select({ id: schema.books.id }).from(schema.books).where(live(schema.books))).map((r) => r.id));

  db.transaction((tx) => {
    const batch = (t: typeof schema.books | typeof schema.notes) => eq(t.deletedAt, at);
    if (kind === 'collection') {
      const bookIds = tx
        .select({ id: schema.books.id })
        .from(schema.books)
        .where(and(eq(schema.books.collectionId, id), batch(schema.books)))
        .all()
        .map((b) => b.id);
      tx.update(schema.collections).set({ deletedAt: null }).where(eq(schema.collections.id, id)).run();
      tx.update(schema.books).set({ deletedAt: null }).where(and(eq(schema.books.collectionId, id), batch(schema.books))).run();
      tx.update(schema.notes).set({ deletedAt: null }).where(and(eq(schema.notes.collectionId, id), batch(schema.notes))).run();
      if (bookIds.length) {
        tx.update(schema.notes).set({ deletedAt: null }).where(and(inArray(schema.notes.bookId, bookIds), batch(schema.notes))).run();
      }
      return;
    }
    if (kind === 'book') {
      const book = tx.select().from(schema.books).where(eq(schema.books.id, id)).get();
      const home = book?.collectionId && liveCollections.has(book.collectionId) ? book.collectionId : null;
      tx.update(schema.books).set({ deletedAt: null, collectionId: home }).where(eq(schema.books.id, id)).run();
      tx.update(schema.notes).set({ deletedAt: null }).where(and(eq(schema.notes.bookId, id), batch(schema.notes))).run();
      return;
    }
    const note = tx.select().from(schema.notes).where(eq(schema.notes.id, id)).get();
    if (!note) return;
    if (note.bookId && !liveBooks.has(note.bookId)) {
      tx.update(schema.notes).set({ deletedAt: null, bookId: null, collectionId: null }).where(eq(schema.notes.id, id)).run();
    } else if (note.collectionId && !liveCollections.has(note.collectionId)) {
      tx.update(schema.notes).set({ deletedAt: null, collectionId: null }).where(eq(schema.notes.id, id)).run();
    } else {
      tx.update(schema.notes).set({ deletedAt: null }).where(eq(schema.notes.id, id)).run();
    }
  });
}

/** Deletes something in Recently deleted for good, with everything that went with it. */
export async function deleteForever(db: Database, kind: ItemKind, id: string): Promise<void> {
  const table = kind === 'collection' ? schema.collections : kind === 'book' ? schema.books : schema.notes;
  const rows = await db.select({ deletedAt: table.deletedAt }).from(table).where(eq(table.id, id));
  if (!rows[0]?.deletedAt) return;
  // Foreign keys cascade: a collection takes its books and notes, a book its pages.
  await db.delete(table).where(eq(table.id, id));
}

/** Deletes for good everything in Recently deleted, or only what was deleted before `before`. */
export async function emptyTrash(db: Database, before?: Date): Promise<void> {
  const cutoff = (t: typeof schema.collections | typeof schema.books | typeof schema.notes) =>
    before ? sql`${t.deletedAt} is not null and ${t.deletedAt} < ${before.getTime()}` : sql`${t.deletedAt} is not null`;
  db.transaction((tx) => {
    tx.delete(schema.notes).where(cutoff(schema.notes)).run();
    tx.delete(schema.books).where(cutoff(schema.books)).run();
    tx.delete(schema.collections).where(cutoff(schema.collections)).run();
  });
}

/** Removes what has been in Recently deleted longer than {@link TRASH_DAYS}. Run at startup. */
export async function purgeOldTrash(db: Database, now = new Date()): Promise<void> {
  await emptyTrash(db, new Date(now.getTime() - TRASH_DAYS * 24 * 60 * 60 * 1000));
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
