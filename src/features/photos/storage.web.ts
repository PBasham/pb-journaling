/** Web is a test surface only: there's no private file storage for photos there. */
import type { ImportedPhoto } from './photos';

export const PHOTO_MAX_SIDE = 2048;
export const PHOTO_QUALITY = 0.8;
export const PHOTOS_SUPPORTED = false;

const unsupported = () => new Error('Photos are only available in the app.');

export function photoUri(fileName: string): string {
  return fileName;
}
export async function importPhoto(_source: { uri: string; width: number; height: number }): Promise<ImportedPhoto> {
  throw unsupported();
}
export function deletePhotoFiles(_fileNames: string[]): void {}
export function listPhotoFiles(): string[] {
  return [];
}
export async function readPhotoBytes(_fileName: string): Promise<Uint8Array> {
  throw unsupported();
}
export function writePhotoBytes(_fileName: string, _bytes: Uint8Array): void {
  throw unsupported();
}
