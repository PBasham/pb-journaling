/** Moving photo files in and out of backups. The zip itself is built in `archive.ts`. */
import type { Database } from '@/db/client';
import { cleanOrphanPhotos } from '@/features/photos/cleanup';
import { readPhotoBytes, writePhotoBytes } from '@/features/photos/storage';

import { openPhoto, type OpenedArchive, type PhotoBlob } from './archive';
import type { BackupData } from './format';

/**
 * Reads every photo the data refers to (copies of a note share a file, so each file once). A row
 * whose file is missing is left out rather than failing the backup, and counted.
 */
export async function collectPhotos(data: BackupData): Promise<{ data: BackupData; photos: PhotoBlob[]; missing: number }> {
  const photos: PhotoBlob[] = [];
  const read = new Map<string, boolean>();
  const kept: BackupData['notePhotos'] = [];
  for (const row of data.notePhotos) {
    const fileName = String(row.fileName);
    if (!read.has(fileName)) {
      try {
        photos.push({ fileName, bytes: await readPhotoBytes(fileName) });
        read.set(fileName, true);
      } catch (e) {
        console.warn('Photo missing, left out of backup', fileName, e);
        read.set(fileName, false);
      }
    }
    if (read.get(fileName)) kept.push(row);
  }
  return { data: { ...data, notePhotos: kept }, photos, missing: data.notePhotos.length - kept.length };
}

/**
 * Writes a backup's photos into app storage before its data goes into the database. Rows whose
 * photo isn't in the backup are dropped, so no note points at a missing picture.
 */
export function restorePhotos(data: BackupData, opened: OpenedArchive, key: Uint8Array | null): BackupData {
  const kept: BackupData['notePhotos'] = [];
  const written = new Set<string>();
  for (const row of data.notePhotos) {
    const fileName = String(row.fileName);
    const stored = opened.photos.get(fileName);
    if (!stored) continue;
    if (!written.has(fileName)) {
      if (opened.photosSealed && !key) throw new Error('This backup is encrypted; the passphrase is needed for its photos.');
      writePhotoBytes(fileName, opened.photosSealed ? openPhoto(key!, stored) : stored);
      written.add(fileName);
    }
    kept.push(row);
  }
  return { ...data, notePhotos: kept };
}

/** After a restore: remove photos the library no longer uses. */
export function removeUnusedPhotos(db: Database): Promise<number> {
  return cleanOrphanPhotos(db);
}
