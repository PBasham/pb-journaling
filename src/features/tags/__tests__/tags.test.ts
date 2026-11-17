import { describe, expect, it, jest } from '@jest/globals';

import { createTestDb } from '../../../../test/testDb';
import { createBook, createCollection, createNote, deleteBook, deleteNote, duplicateBook, searchLibrary } from '../../library/library';
import { deleteTag, findOrCreateTag, getItemTags, getNoteTags, setItemTags, listTagsWithCounts, setNoteTags, tagsForNotes, updateTag } from '../tags';

jest.mock('expo-sqlite', () => ({}));

describe('tags', () => {
  it('finds tags by name in any case, and strips a leading #', async () => {
    const db = createTestDb();
    const a = await findOrCreateTag(db, '#Recipe');
    const b = await findOrCreateTag(db, 'recipe');
    expect(b.id).toBe(a.id);
    expect(a.name).toBe('Recipe');
  });

  it('tags notes and counts them, leaving out deleted notes', async () => {
    const db = createTestDb();
    const tag = await findOrCreateTag(db, 'todo');
    const one = await createNote(db, { collectionId: null }, { title: 'one' });
    const two = await createNote(db, { collectionId: null }, { title: 'two' });
    await setNoteTags(db, one, [tag.id, tag.id]);
    await setNoteTags(db, two, [tag.id]);
    expect((await listTagsWithCounts(db))[0].count).toBe(2);
    await deleteNote(db, two);
    expect((await listTagsWithCounts(db))[0].count).toBe(1);
    expect((await getNoteTags(db, one)).map((t) => t.name)).toEqual(['todo']);
    expect((await tagsForNotes(db, [one, two])).get(one)?.[0].name).toBe('todo');
  });

  it('renaming to an existing name merges the tags', async () => {
    const db = createTestDb();
    const a = await findOrCreateTag(db, 'work');
    const b = await findOrCreateTag(db, 'job');
    const note = await createNote(db, { collectionId: null });
    await setNoteTags(db, note, [b.id]);
    await updateTag(db, b.id, { name: 'Work' });
    expect((await getNoteTags(db, note)).map((t) => t.id)).toEqual([a.id]);
    expect(await listTagsWithCounts(db)).toHaveLength(1);
  });

  it('deleting a tag leaves the notes', async () => {
    const db = createTestDb();
    const tag = await findOrCreateTag(db, 'x');
    const note = await createNote(db, { collectionId: null }, { title: 'kept' });
    await setNoteTags(db, note, [tag.id]);
    await deleteTag(db, tag.id);
    expect(await getNoteTags(db, note)).toEqual([]);
  });

  it('search can filter by tag, with or without words', async () => {
    const db = createTestDb();
    const tag = await findOrCreateTag(db, 'travel');
    const a = await createNote(db, { collectionId: null }, { title: 'Maine plan' });
    await createNote(db, { collectionId: null }, { title: 'Maine budget' });
    await setNoteTags(db, a, [tag.id]);
    expect((await searchLibrary(db, '', { tagId: tag.id })).notes.map((n) => n.title)).toEqual(['Maine plan']);
    expect((await searchLibrary(db, 'maine', { tagId: tag.id })).notes.map((n) => n.title)).toEqual(['Maine plan']);
    expect((await searchLibrary(db, 'maine')).notes).toHaveLength(2);
  });

  it('tags collections and books too, counts them, and finds them by tag', async () => {
    const db = createTestDb();
    const tag = await findOrCreateTag(db, 'home');
    const col = await createCollection(db, { name: 'House', color: 'slate' });
    const book = await createBook(db, { name: 'Repairs', color: 'slate', collectionId: col });
    const note = await createNote(db, { collectionId: null }, { title: 'Paint' });
    await setItemTags(db, 'collection', col, [tag.id]);
    await setItemTags(db, 'book', book, [tag.id]);
    await setNoteTags(db, note, [tag.id]);
    expect((await listTagsWithCounts(db))[0].count).toBe(3);
    expect((await getItemTags(db, 'book', book)).map((t) => t.name)).toEqual(['home']);

    const found = await searchLibrary(db, '', { tagId: tag.id });
    expect(found.collections.map((c) => c.name)).toEqual(['House']);
    expect(found.books.map((b) => b.name)).toEqual(['Repairs']);
    expect(found.notes.map((n) => n.title)).toEqual(['Paint']);

    const copy = await duplicateBook(db, book);
    expect((await getItemTags(db, 'book', copy!)).map((t) => t.id)).toEqual([tag.id]);
    await deleteBook(db, book);
    expect((await listTagsWithCounts(db))[0].count).toBe(3);
  });

  it('merging tags carries over books and collections', async () => {
    const db = createTestDb();
    const a = await findOrCreateTag(db, 'work');
    const b = await findOrCreateTag(db, 'job');
    const col = await createCollection(db, { name: 'C', color: 'slate' });
    await setItemTags(db, 'collection', col, [b.id]);
    await updateTag(db, b.id, { name: 'work' });
    expect((await getItemTags(db, 'collection', col)).map((t) => t.id)).toEqual([a.id]);
  });
});
