import { describe, expect, it, jest } from '@jest/globals';

import { createTestDb } from '../../../../test/testDb';
import { plainTextToDoc } from '../../editor/document';
import {
  createBook,
  createCollection,
  createNote,
  clearAllLocks,
  countLocked,
  likePattern,
  listPages,
  lockChain,
  reorderPages,
  searchLibrary,
  snippetAround,
  updateBook,
  updateCollection,
  updateNote,
} from '../library';

jest.mock('expo-sqlite', () => ({}));

describe('search', () => {
  it('finds collections, books and notes by name, title or text', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'Soup ideas', color: 'slate' });
    await createBook(db, { name: 'Winter soups', color: 'slate', collectionId: col });
    const note = await createNote(db, { collectionId: null }, { title: 'Dinner' });
    await updateNote(db, note, { doc: plainTextToDoc('Make a big pot of SOUP on Sunday') });
    await createNote(db, { collectionId: null }, { title: 'Unrelated' });

    const results = await searchLibrary(db, 'soup');
    expect(results.collections.map((c) => c.name)).toEqual(['Soup ideas']);
    expect(results.books.map((b) => b.name)).toEqual(['Winter soups']);
    expect(results.notes.map((n) => n.title)).toEqual(['Dinner']);
    expect(results.notes[0].snippet).toContain('SOUP');
  });

  it('leaves out anything locked or inside something locked', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'Private plans', color: 'slate' });
    const book = await createBook(db, { name: 'Plans book', color: 'slate', collectionId: col });
    await createNote(db, { bookId: book }, { title: 'plans page' });
    await createNote(db, { collectionId: col }, { title: 'plans note' });
    const lockedNote = await createNote(db, { collectionId: null }, { title: 'plans secret' });
    await createNote(db, { collectionId: null }, { title: 'plans public' });

    await updateCollection(db, col, { isLocked: true });
    await updateNote(db, lockedNote, { isLocked: true });

    const results = await searchLibrary(db, 'plans');
    expect(results.collections).toEqual([]);
    expect(results.books).toEqual([]);
    expect(results.notes.map((n) => n.title)).toEqual(['plans public']);
  });

  it('treats % and _ as plain characters', async () => {
    const db = createTestDb();
    await createNote(db, { collectionId: null }, { title: '100% done' });
    await createNote(db, { collectionId: null }, { title: '100 done' });
    expect((await searchLibrary(db, '100%')).notes.map((n) => n.title)).toEqual(['100% done']);
    expect(likePattern('a_b')).toBe('%a\\_b%');
  });

  it('returns nothing for a blank query', async () => {
    const db = createTestDb();
    await createNote(db, { collectionId: null }, { title: 'x' });
    expect((await searchLibrary(db, '  ')).notes).toEqual([]);
  });

  it('cuts a snippet around the match', () => {
    const text = `${'a '.repeat(60)}needle${' b'.repeat(60)}`;
    const snip = snippetAround(text, 'needle', 10);
    expect(snip.startsWith('…')).toBe(true);
    expect(snip.endsWith('…')).toBe(true);
    expect(snip).toContain('needle');
  });
});

describe('locks', () => {
  it('lists every locked item on the way to a note', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: col });
    const page = await createNote(db, { bookId: book });
    expect(await lockChain(db, 'note', page)).toEqual([]);

    await updateCollection(db, col, { isLocked: true });
    await updateBook(db, book, { isLocked: true });
    await updateNote(db, page, { isLocked: true });
    expect(await lockChain(db, 'note', page)).toEqual([page, book, col]);
    expect(await lockChain(db, 'book', book)).toEqual([book, col]);
    expect(await lockChain(db, 'collection', col)).toEqual([col]);
    expect(await countLocked(db)).toBe(3);
    await clearAllLocks(db);
    expect(await countLocked(db)).toBe(0);
    expect(await lockChain(db, 'note', page)).toEqual([]);
  });
});

describe('reorderPages', () => {
  it('saves a new order and keeps pages it was not told about', async () => {
    const db = createTestDb();
    const book = await createBook(db, { name: 'B', color: 'slate', collectionId: null });
    const a = await createNote(db, { bookId: book }, { title: 'A' });
    const b = await createNote(db, { bookId: book }, { title: 'B' });
    const c = await createNote(db, { bookId: book }, { title: 'C' });
    await reorderPages(db, book, [c, a]);
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['C', 'A', 'B']);
    await reorderPages(db, book, [b, 'not-a-page', c, a]);
    expect((await listPages(db, book)).map((p) => p.title)).toEqual(['B', 'C', 'A']);
  });
});
