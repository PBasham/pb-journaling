import { describe, expect, it, jest } from '@jest/globals';
import { strToU8, zipSync } from 'fflate';

import {
  backupKey,
  buildArchive,
  isArchive,
  openBackupBytes,
  openPhoto,
  readArchive,
} from '../archive';
import { BackupError, buildBackup, encryptBackup, parseBackup, type BackupData } from '../format';

jest.mock('expo-sqlite', () => ({}));

const emptyData = (): BackupData => ({
  collections: [],
  books: [],
  notes: [],
  tags: [],
  noteTags: [],
  bookTags: [],
  collectionTags: [],
  templates: [],
  notePhotos: [{ id: 'p1', noteId: 'n1', fileName: 'a.jpg', width: 10, height: 10, position: 0 }],
  settings: [],
});
const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 4, 0xff, 0xd9]);

describe('backup archives', () => {
  it('round trips a plain backup with photos', () => {
    const file = buildBackup(emptyData(), 3);
    const zip = buildArchive(file, [{ fileName: 'a.jpg', bytes: jpeg }], null);
    expect(isArchive(zip)).toBe(true);
    const opened = openBackupBytes(zip);
    expect(opened.photosSealed).toBe(false);
    expect(opened.photos.get('a.jpg')).toEqual(jpeg);
    const parsed = parseBackup(opened.text, 3);
    expect(parsed.encrypted).toBe(false);
  });

  it('seals photos in an encrypted backup with the same passphrase', async () => {
    const plain = buildBackup(emptyData(), 3);
    const file = await encryptBackup(plain, 'correct horse', 1000);
    const key = await backupKey(file, 'correct horse');
    const zip = buildArchive(file, [{ fileName: 'a.jpg', bytes: jpeg }], key);
    const opened = readArchive(zip);
    expect(opened.photosSealed).toBe(true);
    const sealed = opened.photos.get('a.jpg')!;
    expect(sealed).not.toEqual(jpeg);
    expect(openPhoto(key, sealed)).toEqual(jpeg);
    const wrong = await backupKey(file, 'wrong passphrase');
    expect(() => openPhoto(wrong, sealed)).toThrow(BackupError);
  });

  it('refuses a key on a plain backup and a missing key on an encrypted one', async () => {
    const plain = buildBackup(emptyData(), 3);
    expect(() => buildArchive(plain, [], new Uint8Array(32))).toThrow();
    const enc = await encryptBackup(plain, 'correct horse', 1000);
    expect(() => buildArchive(enc, [], null)).toThrow();
  });

  it('still reads first version backups, without tags, templates or photos', () => {
    const data = emptyData() as Partial<BackupData>;
    delete data.notePhotos;
    delete data.tags;
    delete data.noteTags;
    delete data.bookTags;
    delete data.collectionTags;
    delete data.templates;
    const text = JSON.stringify({ ...buildBackup(emptyData(), 2), data });
    const opened = openBackupBytes(strToU8(text));
    expect(opened.photos.size).toBe(0);
    const parsed = parseBackup(opened.text, 3);
    expect(parsed.encrypted === false && parsed.data.notePhotos).toEqual([]);
  });

  it('ignores file names that could escape the photos folder', () => {
    const zip = zipSync({
      'backup.json': strToU8(JSON.stringify(buildBackup(emptyData(), 3))),
      'photos/ok.jpg': jpeg,
      'photos/../evil.jpg': jpeg,
      'photos/.hidden': jpeg,
      'photos/sub/dir.jpg': jpeg,
    });
    expect([...readArchive(zip).photos.keys()]).toEqual(['ok.jpg']);
  });

  it('says so when a zip is not a backup', () => {
    expect(() => readArchive(zipSync({ 'other.txt': strToU8('hi') }))).toThrow('not a PB Notes backup');
  });
});
