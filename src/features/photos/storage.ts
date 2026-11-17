/**
 * Photo files in the app's private storage. Each picked photo is copied in, shrunk and re-saved as
 * JPEG, which also drops hidden details such as GPS location. Deleting the original from the
 * gallery doesn't affect the copy.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { newId } from '@/lib/id';

import type { ImportedPhoto } from './photos';

/** Longest side after shrinking. Sharp on any phone screen, a few hundred KB per photo. */
export const PHOTO_MAX_SIDE = 2048;
export const PHOTO_QUALITY = 0.8;

export const PHOTOS_SUPPORTED = true;

export function photosDirectory(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function photoFile(fileName: string): File {
  return new File(photosDirectory(), fileName);
}

export function photoUri(fileName: string): string {
  return photoFile(fileName).uri;
}

/** Copies a picked image into app storage, shrunk to fit PHOTO_MAX_SIDE. */
export async function importPhoto(source: { uri: string; width: number; height: number }): Promise<ImportedPhoto> {
  const context = ImageManipulator.manipulate(source.uri);
  const longest = Math.max(source.width, source.height);
  if (longest > PHOTO_MAX_SIDE) {
    context.resize(source.width >= source.height ? { width: PHOTO_MAX_SIDE } : { height: PHOTO_MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY });
  const fileName = `${newId()}.jpg`;
  const temp = new File(saved.uri);
  temp.moveSync(new File(photosDirectory(), fileName));
  return { fileName, width: saved.width, height: saved.height };
}

/** Deletes photo files. Missing files are fine (already gone). */
export function deletePhotoFiles(fileNames: string[]): void {
  for (const name of fileNames) {
    try {
      const file = photoFile(name);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn('Could not delete photo file', name, e);
    }
  }
}

/** Every file in the photos folder. */
export function listPhotoFiles(): string[] {
  return photosDirectory()
    .list()
    .filter((item): item is File => item instanceof File)
    .map((f) => f.name);
}

export async function readPhotoBytes(fileName: string): Promise<Uint8Array> {
  return photoFile(fileName).bytes();
}

export function writePhotoBytes(fileName: string, bytes: Uint8Array): void {
  const file = photoFile(fileName);
  if (file.exists) file.delete();
  file.create();
  file.writeSync(bytes);
}
