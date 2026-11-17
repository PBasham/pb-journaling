import { describe, expect, it, jest } from '@jest/globals';

import { createTestDb } from '../../../../test/testDb';
import { plainTextToDoc } from '../../editor/document';
import {
  createBook,
  createCollection,
  createNote,
  getNote,
  listCollections,
  listPages,
  setSetting,
  updateNote,
} from '../../library/library';
import { findOrCreateTag, getNoteTags, setNoteTags } from '../../tags/tags';
import { countExisting, readAllData, restoreData, SCHEMA_VERSION } from '../database';
import {
  BackupError,
  buildBackup,
  decryptBackup,
  encryptBackup,
  parseBackup,
  summarizeBackup,
  type PlainBackup,
} from '../format';

jest.mock('expo-sqlite', () => ({}));
jest.mock('../../../../drizzle/migrations', () => ({
  __esModule: true,
  default: { journal: { entries: [{}, {}] }, migrations: {} },
}));

async function sampleLibrary() {
  const db = createTestDb();
  const col = await createCollection(db, { name: 'Recipes', color: 'orange' });
  const book = await createBook(db, { name: 'Vegan', color: 'green', collectionId: col });
  const page = await createNote(db, { bookId: book }, { title: 'Soup' });
  await updateNote(db, page, { doc: plainTextToDoc('Lentils') });
  await createNote(db, { bookId: book }, { title: 'Stew' });
  await createNote(db, { collectionId: null }, { title: 'Loose' });
  await setSetting(db, 'app.accent', 'rose');
  return { db, col, book, page };
}

describe('backup round trip', () => {
  it('restores into an empty library exactly, dates included', async () => {
    const { db, page } = await sampleLibrary();
    const backup = buildBackup(await readAllData(db), SCHEMA_VERSION);
    const text = JSON.stringify(backup);

    const fresh = createTestDb();
    const parsed = parseBackup(text, SCHEMA_VERSION) as PlainBackup;
    expect(summarizeBackup(parsed.data)).toEqual({ collections: 1, books: 1, pages: 2, notes: 1, photos: 0 });
    await restoreData(fresh, parsed.data, 'replace');

    const original = await getNote(db, page);
    const restored = await getNote(fresh, page);
    expect(restored).toEqual(original);
    expect(restored?.updatedAt).toBeInstanceOf(Date);
    expect((await listCollections(fresh))[0]).toMatchObject({ name: 'Recipes', bookCount: 1 });
  });

  it('replace removes what the backup does not have', async () => {
    const { db } = await sampleLibrary();
    const backup = buildBackup(await readAllData(db), SCHEMA_VERSION);
    await createNote(db, { collectionId: null }, { title: 'Made after the backup' });
    await restoreData(db, backup.data, 'replace');
    const titles = (await readAllData(db)).notes.map((n) => n.title);
    expect(titles).not.toContain('Made after the backup');
  });

  it('merge adds only what is missing and keeps what is here', async () => {
    const { db, book } = await sampleLibrary();
    const backup = buildBackup(await readAllData(db), SCHEMA_VERSION);
    const target = createTestDb();
    await createNote(target, { collectionId: null }, { title: 'Already here' });
    await restoreData(target, backup.data, 'merge');
    await restoreData(target, backup.data, 'merge'); // twice: no duplicates
    const notes = (await readAllData(target)).notes.map((n) => n.title).sort();
    expect(notes).toEqual(['Already here', 'Loose', 'Soup', 'Stew']);
    expect(await listPages(target, book)).toHaveLength(2);
    expect(await countExisting(target, backup.data)).toBe(5);
    // Settings are left alone when merging.
    expect((await readAllData(target)).settings).toEqual([]);
  });

  it('merging joins tags that share a name and keeps their notes tagged', async () => {
    const { db, page } = await sampleLibrary();
    const tag = await findOrCreateTag(db, 'Soup');
    await setNoteTags(db, page, [tag.id]);
    const backup = buildBackup(await readAllData(db), SCHEMA_VERSION);
    const target = createTestDb();
    const local = await findOrCreateTag(target, 'soup');
    await restoreData(target, backup.data, 'merge');
    expect((await getNoteTags(target, page)).map((t) => t.id)).toEqual([local.id]);
  });

  it('ignores columns this app version does not know', async () => {
    const { db } = await sampleLibrary();
    const data = await readAllData(db);
    data.notes = data.notes.map((n) => ({ ...n, someFutureColumn: 1 }));
    const fresh = createTestDb();
    await restoreData(fresh, data, 'replace');
    expect((await readAllData(fresh)).notes).toHaveLength(3);
  });
});

describe('encrypted backups', () => {
  it('opens with the right passphrase only', async () => {
    const { db } = await sampleLibrary();
    const backup = buildBackup(await readAllData(db), SCHEMA_VERSION);
    const encrypted = await encryptBackup(backup, 'correct horse', 10);
    expect(JSON.stringify(encrypted)).not.toContain('Lentils');

    const parsed = parseBackup(JSON.stringify(encrypted), SCHEMA_VERSION);
    expect(parsed.encrypted).toBe(true);
    if (!parsed.encrypted) return;
    await expect(decryptBackup(parsed, 'wrong horse')).rejects.toThrow(BackupError);
    const opened = await decryptBackup(parsed, 'correct horse');
    expect(opened.data.notes).toHaveLength(3);
  });

  it('needs a long enough passphrase', async () => {
    const backup = buildBackup({ collections: [], books: [], notes: [], tags: [], noteTags: [], templates: [], notePhotos: [], settings: [] }, SCHEMA_VERSION);
    await expect(encryptBackup(backup, 'short', 10)).rejects.toThrow('at least 8');
  });
});

describe('parseBackup', () => {
  it('refuses other files, damaged files and newer versions', () => {
    expect(() => parseBackup('not json', SCHEMA_VERSION)).toThrow('not a PB Notes backup');
    expect(() => parseBackup('{"app":"other"}', SCHEMA_VERSION)).toThrow('not a PB Notes backup');
    const good = buildBackup({ collections: [], books: [], notes: [], tags: [], noteTags: [], templates: [], notePhotos: [], settings: [] }, SCHEMA_VERSION);
    expect(() => parseBackup(JSON.stringify({ ...good, schemaVersion: SCHEMA_VERSION + 1 }), SCHEMA_VERSION)).toThrow(
      'newer version',
    );
    expect(() => parseBackup(JSON.stringify({ ...good, data: { notes: 'x' } }), SCHEMA_VERSION)).toThrow('damaged');
  });
});
