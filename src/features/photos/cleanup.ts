import type { Database } from '@/db/client';

import { allPhotoFiles } from './photos';
import { deletePhotoFiles, listPhotoFiles } from './storage';

/**
 * Deletes photo files no note uses (removed photos, notes deleted for good, or replaced by a
 * restore). Never touches a file the database still points to. Copies of a note share files.
 */
export async function cleanOrphanPhotos(db: Database): Promise<number> {
  const known = await allPhotoFiles(db);
  const orphans = listPhotoFiles().filter((name) => !known.has(name));
  deletePhotoFiles(orphans);
  return orphans.length;
}
