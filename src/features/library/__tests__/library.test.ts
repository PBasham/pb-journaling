import { describe, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';

import { notes } from '@/db/schema';

import { findOrCreateTag, setNoteTags } from '../../tags/tags';

import { createTestDb } from '../../../../test/testDb';
import { plainTextToDoc } from '../../editor/document';
import {
  createBook,
  createCollection,
  createNote,
  deleteBook,
  deleteCollection,
  deleteNote,
  getBook,
  getNote,
  getSetting,
  listBooks,
  listCollections,
  listFavorites,
  listNotes,
  listPages,
  moveBook,
  moveNote,
  deleteForever,
  listMoveCandidates,
  moveItemsInto,
  takeOut,
  discardNote,
  duplicateBook,
  duplicateNote,
  listRecentlyOpened,
  markOpened,
  noteStats,
  emptyTrash,
  listTrash,
  purgeOldTrash,
  restoreDeleted,
  searchLibrary,
  setSetting,
  shiftPage,
  updateCollection,
  updateNote,
} from '../library';

jest.mock('expo-sqlite', () => ({}));

const tick = () => new Promise((r) => setTimeout(r, 5));

describe('collections', () => {
  it('creates, renames and counts what is inside', async () => {
    const db = createTestDb();
    const id = await createCollection(db, { name: '  Recipes  ', color: 'orange' });
    await createBook(db, { name: 'Vegan', color: 'green', collectionId: id });
    await createBook(db, { name: 'Normal', color: 'red', collectionId: id });
    await createNote(db, { collectionId: id }, { title: 'Shopping list' });

    let [c] = await listCollections(db);
    expect(c).toMatchObject({ name: 'Recipes', color: 'orange', bookCount: 2, noteCount: 1 });

    await updateCollection(db, id, { name: 'Cooking' });
    [c] = await listCollections(db);
    expect(c.name).toBe('Cooking');
  });

  it('names an empty collection', async () => {
    const db = createTestDb();
    await createCollection(db, { name: '   ', color: 'slate' });
    expect((await listCollections(db))[0].name).toBe('Untitled collection');
  });

  it('sorts by name, ignoring case, either way', async () => {
    const db = createTestDb();
    await createCollection(db, { name: 'banana', color: 'slate' });
    await createCollection(db, { name: 'Apple', color: 'slate' });
    await createCollection(db, { name: 'cherry', color: 'slate' });
    const asc = (await listCollections(db, { field: 'name', ascending: true })).map((c) => c.name);
    expect(asc).toEqual(['Apple', 'banana', 'cherry']);
    const desc = (await listCollections(db, { field: 'name', ascending: false })).map((c) => c.name);
    expect(desc).toEqual(['cherry', 'banana', 'Apple']);
  });

  it('deleting everything removes books, pages and notes inside', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    const page = await createNote(db, { bookId: book });
    const note = await createNote(db, { collectionId: col });

    await deleteCollection(db, col, 'everything');
    expect(await getBook(db, book)).toBeUndefined();
    expect(await getNote(db, page)).toBeUndefined();
    expect(await getNote(db, note)).toBeUndefined();
  });

  it('deleting but keeping contents moves them to the top level', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    const page = await createNote(db, { bookId: book });
    const note = await createNote(db, { collectionId: col });

    await deleteCollection(db, col, 'keepContents');
    expect((await listBooks(db, null)).map((b) => b.id)).toEqual([book]);
    expect((await listNotes(db, null)).map((n) => n.id)).toEqual([note]);
    expect((await getNote(db, page))?.bookId).toBe(book);
  });

  it('can be put back after deleting, with everything inside', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    const page = await createNote(db, { bookId: book }, { title: 'p1' });
    await createNote(db, { collectionId: col }, { title: 'loose' });

    await deleteCollection(db, col, 'everything');
    expect(await listCollections(db)).toEqual([]);
    await restoreDeleted(db, 'collection', col);

    const [c] = await listCollections(db);
    expect(c).toMatchObject({ id: col, bookCount: 1, noteCount: 1 });
    expect((await getNote(db, page))?.bookId).toBe(book);
  });
});

describe('books and pages', () => {
  it('adds pages to the end and reorders them', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'Diary', color: 'blue', collectionId: null });
    const a = await createNote(db, { bookId: book }, { title: 'A' });
    const b = await createNote(db, { bookId: book }, { title: 'B' });
    const c = await createNote(db, { bookId: book }, { title: 'C' });
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['A', 'B', 'C']);

    await shiftPage(db, c, -1);
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['A', 'C', 'B']);
    await shiftPage(db, a, -1); // already first: no change
    await shiftPage(db, b, 1); // already last: no change
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['A', 'C', 'B']);
    expect((await listBooks(db, null))[0].pageCount).toBe(3);
  });

  it('pages are not listed as loose notes', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    await createNote(db, { bookId: book });
    await createNote(db, { collectionId: null }, { title: 'loose' });
    expect((await listNotes(db, null)).map((n) => n.title)).toEqual(['loose']);
  });

  it('moving a book takes its pages along', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    await createNote(db, { bookId: book });
    await moveBook(db, book, col);
    expect((await listBooks(db, col)).map((b) => b.id)).toEqual([book]);
    expect((await listBooks(db, null))).toEqual([]);
    expect(await listPages(db, book)).toHaveLength(1);
  });

  it('deleting a book deletes its pages, and undo brings both back', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const page = await createNote(db, { bookId: book });
    await deleteBook(db, book);
    expect(await getNote(db, page)).toBeUndefined();
    await restoreDeleted(db, 'book', book);
    expect((await getNote(db, page))?.bookId).toBe(book);
  });
});

describe('notes', () => {
  it('keeps plain text in step with the document', async () => {
    const db = createTestDb();
    const id = await createNote(db, { collectionId: null }, { title: ' Ideas ' });
    await updateNote(db, id, { doc: plainTextToDoc('First line\nSecond') });
    const note = await getNote(db, id);
    expect(note?.title).toBe('Ideas');
    expect(note?.contentText).toBe('First line\nSecond');
  });

  it('moves between the top level, collections and books', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    await createNote(db, { bookId: book }, { title: 'first page' });
    const id = await createNote(db, { collectionId: null });

    await moveNote(db, id, { collectionId: col });
    expect(await getNote(db, id)).toMatchObject({ collectionId: col, bookId: null });

    await moveNote(db, id, { bookId: book });
    expect(await getNote(db, id)).toMatchObject({ collectionId: null, bookId: book });
    expect((await listPages(db, book)).map((p) => p.id).at(-1)).toBe(id);

    await moveNote(db, id, { collectionId: null });
    expect(await getNote(db, id)).toMatchObject({ collectionId: null, bookId: null });
  });

  it('a note can never be in a collection and a book at once', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const id = await createNote(db, { bookId: book });
    expect(() => db.update(notes).set({ collectionId: col }).where(eq(notes.id, id)).run()).toThrow();
  });

  it('editing a page counts as updating its book and collection', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    const page = await createNote(db, { bookId: book });
    const before = (await getBook(db, book))!.updatedAt.getTime();
    await tick();
    await updateNote(db, page, { title: 'changed' });
    expect((await getBook(db, book))!.updatedAt.getTime()).toBeGreaterThan(before);
  });

  it('favoriting does not count as an edit', async () => {
    const db = createTestDb();
    const id = await createNote(db, { collectionId: null });
    const before = (await getNote(db, id))!.updatedAt.getTime();
    await tick();
    await updateNote(db, id, { isFavorite: true });
    const after = await getNote(db, id);
    expect(after?.isFavorite).toBe(true);
    expect(after!.updatedAt.getTime()).toBe(before);
    expect((await listFavorites(db)).notes.map((n) => n.id)).toEqual([id]);
  });

  it('undo after deleting a page whose book is gone puts it at the top level', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const page = await createNote(db, { bookId: book }, { title: 'keep me' });
    await deleteNote(db, page);
    await deleteBook(db, book);
    await restoreDeleted(db, 'note', page);
    expect(await getNote(db, page)).toMatchObject({ bookId: null, collectionId: null, title: 'keep me' });
  });
});

describe('discardNote', () => {
  it('removes a blank note for good, but not one with tags', async () => {
    const db = createTestDb();
    const blank = await createNote(db, { collectionId: null });
    await discardNote(db, blank);
    expect(await getNote(db, blank)).toBeUndefined();
    expect(await listTrash(db)).toEqual([]);
    const tagged = await createNote(db, { collectionId: null });
    await setNoteTags(db, tagged, [(await findOrCreateTag(db, 'keep')).id]);
    await discardNote(db, tagged);
    expect(await getNote(db, tagged)).toBeDefined();
  });
});

describe('pinning', () => {
  it('lists pinned items first, whatever the sort', async () => {
    const db = createTestDb();
    await createNote(db, { collectionId: null }, { title: 'b' });
    const a = await createNote(db, { collectionId: null }, { title: 'a' });
    await createNote(db, { collectionId: null }, { title: 'c' });
    await updateNote(db, a, { isPinned: true });
    const byName = (await listNotes(db, null, { field: 'name', ascending: false })).map((n) => n.title);
    expect(byName).toEqual(['a', 'c', 'b']);
    const col = await createCollection(db, { name: 'z', color: 'slate' });
    await createCollection(db, { name: 'y', color: 'slate' });
    await updateCollection(db, col, { isPinned: true });
    expect((await listCollections(db, { field: 'name', ascending: true })).map((c) => c.name)).toEqual(['z', 'y']);
  });
});

describe('recently deleted', () => {
  it('lists a deleted collection once, with what went with it', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    await createNote(db, { bookId: book });
    await createNote(db, { bookId: book });
    await createNote(db, { collectionId: col });
    const lone = await createNote(db, { collectionId: null }, { title: 'lone' });
    await deleteNote(db, lone);
    await deleteCollection(db, col, 'everything');

    const trash = await listTrash(db);
    expect(trash.map((t) => [t.kind, t.name])).toEqual([
      ['collection', 'C'],
      ['note', 'lone'],
    ]);
    expect(trash[0].contains).toEqual({ books: 1, pages: 2, notes: 1 });
  });

  it('restores only what was deleted together', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const early = await createNote(db, { bookId: book }, { title: 'early' });
    await createNote(db, { bookId: book }, { title: 'later' });
    await deleteNote(db, early);
    await new Promise((r) => setTimeout(r, 5));
    await deleteBook(db, book);
    await restoreDeleted(db, 'book', book);
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['later']);
    expect((await listTrash(db)).map((t) => t.name)).toEqual(['early']);
  });

  it('a restored book goes to the top level if its collection is deleted', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    await deleteBook(db, book);
    await new Promise((r) => setTimeout(r, 5));
    await deleteCollection(db, col, 'everything');
    await restoreDeleted(db, 'book', book);
    expect((await listBooks(db, null)).map((b) => b.id)).toEqual([book]);
  });

  it('deletes for good one item, everything, or what is older than 30 days', async () => {
    const db = createTestDb();
    const a = await createNote(db, { collectionId: null });
    const b = await createNote(db, { collectionId: null });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const page = await createNote(db, { bookId: book });
    await deleteNote(db, a);
    await deleteNote(db, b);
    await deleteBook(db, book);

    await deleteForever(db, 'note', a);
    expect((await listTrash(db)).map((t) => t.id).sort()).toEqual([b, book].sort());

    await purgeOldTrash(db, new Date(Date.now() + 29 * 86_400_000));
    expect(await listTrash(db)).toHaveLength(2);
    await purgeOldTrash(db, new Date(Date.now() + 31 * 86_400_000));
    expect(await listTrash(db)).toEqual([]);
    // The page went with its book: nothing left behind.
    await restoreDeleted(db, 'note', page);
    expect(await getNote(db, page)).toBeUndefined();

    const c = await createNote(db, { collectionId: null });
    await deleteNote(db, c);
    await emptyTrash(db);
    expect(await listTrash(db)).toEqual([]);
  });

  it('deleted items stay out of lists, counts, search and favorites', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const n = await createNote(db, { collectionId: col }, { title: 'findme' });
    await updateNote(db, n, { isFavorite: true });
    await deleteNote(db, n);
    expect((await listCollections(db))[0].noteCount).toBe(0);
    expect((await listFavorites(db)).notes).toEqual([]);
    expect((await searchLibrary(db, 'findme')).notes).toEqual([]);
  });
});

describe('bringing things in and taking them out', () => {
  it('offers books, loose notes and pages from elsewhere for a collection', async () => {
    const db = createTestDb();
    const here = await createCollection(db, { name: 'Here', color: 'slate' });
    const there = await createCollection(db, { name: 'There', color: 'slate' });
    await createBook(db, { name: 'Inside', color: 'slate', collectionId: here });
    const outside = await createBook(db, { name: 'Outside', color: 'slate', collectionId: there });
    await createNote(db, { bookId: outside }, { title: 'a page' });
    await createNote(db, { collectionId: here }, { title: 'already here' });
    await createNote(db, { collectionId: null }, { title: 'loose' });

    const found = await listMoveCandidates(db, { collectionId: here });
    expect(found.map((c) => `${c.kind}:${c.name}:${c.where}`).sort()).toEqual([
      'book:Outside:There',
      'note:a page:Page in Outside',
      'note:loose:Library',
    ]);
  });

  it('offers notes and other pages for a book, never books', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const other = await createBook(db, { name: 'Other', color: 'slate', collectionId: null });
    await createNote(db, { bookId: book }, { title: 'mine' });
    await createNote(db, { bookId: other }, { title: 'theirs' });
    await createNote(db, { collectionId: null }, { title: 'loose' });
    const found = await listMoveCandidates(db, { bookId: book });
    expect(found.map((c) => c.name).sort()).toEqual(['loose', 'theirs']);
    expect(found.every((c) => c.kind === 'note')).toBe(true);
  });

  it('moves several things in at once, pages in order', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const n1 = await createNote(db, { collectionId: null }, { title: 'one' });
    const n2 = await createNote(db, { collectionId: null }, { title: 'two' });
    await moveItemsInto(db, { bookId: book }, [
      { kind: 'note', id: n2 },
      { kind: 'note', id: n1 },
    ]);
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['two', 'one']);
    await moveItemsInto(db, { collectionId: col }, [
      { kind: 'book', id: book },
      { kind: 'note', id: n1 },
    ]);
    expect((await listBooks(db, col)).map((b) => b.name)).toEqual(['B']);
    expect((await listNotes(db, col)).map((n) => n.title)).toEqual(['one']);
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['two']);
  });

  it('takes a page out to its book\'s collection, and a book or note out to the Library', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    const page = await createNote(db, { bookId: book }, { title: 'page' });
    await takeOut(db, 'note', page);
    expect(await getNote(db, page)).toMatchObject({ bookId: null, collectionId: col });
    await takeOut(db, 'note', page);
    expect(await getNote(db, page)).toMatchObject({ bookId: null, collectionId: null });
    await takeOut(db, 'book', book);
    expect((await getBook(db, book))?.collectionId).toBeNull();
  });
});

describe('copies, stats and recently opened', () => {
  it('duplicates a page right after the original, and a whole book', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const a = await createNote(db, { bookId: book }, { title: 'A' });
    await createNote(db, { bookId: book }, { title: 'C' });
    await duplicateNote(db, a);
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['A', 'A copy', 'C']);
    const copy = await duplicateBook(db, book);
    expect((await listPages(db, copy!)).map((p) => p.title)).toEqual(['A', 'A copy', 'C']);
    expect((await listBooks(db, null)).map((b) => b.name).sort()).toEqual(['B', 'B copy']);
  });

  it('counts words and reading time', () => {
    expect(noteStats('')).toEqual({ words: 0, characters: 0, readingMinutes: 0 });
    expect(noteStats('one two\nthree')).toMatchObject({ words: 3, readingMinutes: 1 });
  });

  it('lists recently opened notes, newest first', async () => {
    const db = createTestDb();
    const a = await createNote(db, { collectionId: null }, { title: 'a' });
    const b = await createNote(db, { collectionId: null }, { title: 'b' });
    await createNote(db, { collectionId: null }, { title: 'never' });
    await markOpened(db, a);
    await new Promise((r) => setTimeout(r, 5));
    await markOpened(db, b);
    expect((await listRecentlyOpened(db)).map((n) => n.title)).toEqual(['b', 'a']);
    await deleteNote(db, b);
    expect((await listRecentlyOpened(db)).map((n) => n.title)).toEqual(['a']);
  });
});

describe('settings', () => {
  it('stores and replaces values', async () => {
    const db = createTestDb();
    expect(await getSetting(db, 'sort', 'none')).toBe('none');
    await setSetting(db, 'sort', { field: 'name', ascending: true });
    await setSetting(db, 'sort', { field: 'created', ascending: false });
    expect(await getSetting(db, 'sort', null)).toEqual({ field: 'created', ascending: false });
  });
});
