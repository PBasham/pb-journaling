import { describe, expect, it, jest } from '@jest/globals';

import { createTestDb } from '../../../../test/testDb';
import { listCollections, listFavorites, listNotes, listTrash, purgeOldTrash } from '../../library/library';
import { listTagsWithCounts } from '../../tags/tags';
import { countEverything, createBulkData, createOldDeletedNote, createSampleLibrary, eraseLibrary } from '../sample';

jest.mock('expo-sqlite', () => ({}));

describe('sample data', () => {
  it('builds a small library with collections, books, tags, a favorite and a pin', async () => {
    const db = createTestDb();
    await createSampleLibrary(db);
    const collections = await listCollections(db, { field: 'name', ascending: true });
    expect(collections.map((c) => c.name)).toEqual(['Recipes', 'Work']);
    expect(collections[0]).toMatchObject({ bookCount: 2, noteCount: 1 });
    expect((await listNotes(db, null))[0].title).toBe('Ideas');
    expect((await listFavorites(db)).collections).toHaveLength(1);
    expect((await listTagsWithCounts(db)).map((t) => `${t.name}:${t.count}`)).toEqual(['recipe:4', 'todo:2', 'travel:3']);
  });

  it('makes bulk data of the requested size', async () => {
    const db = createTestDb();
    await createBulkData(db, { collections: 2, booksPerCollection: 2, pagesPerBook: 3, looseNotes: 4 });
    expect(await countEverything(db)).toMatchObject({ collections: 2, books: 4, notes: 16 });
  });

  it('makes an old deleted note that the clean up removes', async () => {
    const db = createTestDb();
    await createOldDeletedNote(db, 31);
    expect(await listTrash(db)).toHaveLength(1);
    await purgeOldTrash(db);
    expect(await listTrash(db)).toHaveLength(0);
  });

  it('erases everything', async () => {
    const db = createTestDb();
    await createSampleLibrary(db);
    await eraseLibrary(db);
    expect(await countEverything(db)).toMatchObject({ collections: 0, books: 0, notes: 0, tags: 0 });
  });
});
