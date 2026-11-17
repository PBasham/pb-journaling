/**
 * Backups with photos: one zip holding `backup.json` (the same file a photo-free backup is) and the
 * photos. In an encrypted backup each photo is encrypted with the same passphrase. Pure functions
 * over bytes, so they're tested without a phone.
 */
import { gcm } from "@noble/ciphers/aes.js";
import { bytesToUtf8, utf8ToBytes } from "@noble/ciphers/utils.js";
import { unzipSync, zipSync, type Zippable } from "fflate";

import { base64ToBytes, deriveKey, randomBytes } from "@/lib/crypto";

import { BackupError, type BackupFile, type EncryptedBackup } from "./format";

export const ARCHIVE_DATA_FILE = "backup.json";
export const ARCHIVE_PHOTOS_DIR = "photos/";
const ENCRYPTED_SUFFIX = ".enc";
const NONCE_BYTES = 12;

export interface PhotoBlob {
  fileName: string;
  bytes: Uint8Array;
}

/** True for zip files (they start with "PK"). Old backups are plain JSON text. */
export function isArchive(bytes: Uint8Array): boolean {
  return (
    bytes.length > 3 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

/** The key an encrypted backup's photos are sealed with: the same one as its data. */
export function backupKey(
  file: EncryptedBackup,
  passphrase: string,
): Promise<Uint8Array> {
  return deriveKey(
    passphrase,
    base64ToBytes(file.kdf.salt),
    file.kdf.iterations,
  );
}

/** Nonce first, then the sealed bytes. */
export function sealPhoto(key: Uint8Array, bytes: Uint8Array): Uint8Array {
  const nonce = randomBytes(NONCE_BYTES);
  const sealed = gcm(key, nonce).encrypt(bytes);
  const out = new Uint8Array(NONCE_BYTES + sealed.length);
  out.set(nonce);
  out.set(sealed, NONCE_BYTES);
  return out;
}

export function openPhoto(key: Uint8Array, sealed: Uint8Array): Uint8Array {
  try {
    return gcm(key, sealed.subarray(0, NONCE_BYTES)).decrypt(
      sealed.subarray(NONCE_BYTES),
    );
  } catch {
    throw new BackupError(
      "A photo in this backup is damaged or uses a different passphrase.",
    );
  }
}

/**
 * Builds the zip. Pass `key` for an encrypted backup (from `backupKey`); photos are then sealed.
 * Photos are stored without compression: JPEGs are already compressed.
 */
export function buildArchive(
  file: BackupFile,
  photos: PhotoBlob[],
  key: Uint8Array | null,
): Uint8Array {
  if (file.encrypted !== (key !== null))
    throw new Error(
      "Encrypted backups need a key, plain ones must not have one.",
    );
  const entries: Zippable = {
    [ARCHIVE_DATA_FILE]: [utf8ToBytes(JSON.stringify(file)), { level: 6 }],
  };
  for (const photo of photos) {
    const name =
      ARCHIVE_PHOTOS_DIR + photo.fileName + (key ? ENCRYPTED_SUFFIX : "");
    entries[name] = [
      key ? sealPhoto(key, photo.bytes) : photo.bytes,
      { level: 0 },
    ];
  }
  return zipSync(entries);
}

export interface OpenedArchive {
  /** The `backup.json` text, for `parseBackup`. */
  text: string;
  /** Photo bytes by file name, still sealed if the backup is encrypted. */
  photos: Map<string, Uint8Array>;
  photosSealed: boolean;
}

export function readArchive(bytes: Uint8Array): OpenedArchive {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new BackupError("This backup file is damaged.");
  }
  const data = files[ARCHIVE_DATA_FILE];
  if (!data) throw new BackupError("This file is not a PB Notes backup.");
  const photos = new Map<string, Uint8Array>();
  let photosSealed = false;
  for (const [name, content] of Object.entries(files)) {
    if (!name.startsWith(ARCHIVE_PHOTOS_DIR) || name === ARCHIVE_PHOTOS_DIR)
      continue;
    let fileName = name.slice(ARCHIVE_PHOTOS_DIR.length);
    if (fileName.endsWith(ENCRYPTED_SUFFIX)) {
      fileName = fileName.slice(0, -ENCRYPTED_SUFFIX.length);
      photosSealed = true;
    }
    // Only plain file names: nothing in a backup may write outside the photos folder.
    if (!/^[A-Za-z0-9._-]+$/.test(fileName) || fileName.startsWith("."))
      continue;
    photos.set(fileName, content);
  }
  return { text: bytesToUtf8(data), photos, photosSealed };
}

/** Reads a picked backup: a zip with photos, or an older plain JSON file. */
export function openBackupBytes(bytes: Uint8Array): OpenedArchive {
  if (isArchive(bytes)) return readArchive(bytes);
  return { text: bytesToUtf8(bytes), photos: new Map(), photosSealed: false };
}

/** A Markdown export with its photos: `notes.md` plus `photos/`, matching the links inside. */
export function buildMarkdownArchive(
  markdown: string,
  photos: PhotoBlob[],
): Uint8Array {
  const entries: Zippable = {
    "notes.md": [utf8ToBytes(markdown), { level: 6 }],
  };
  for (const p of photos)
    entries[ARCHIVE_PHOTOS_DIR + p.fileName] = [p.bytes, { level: 0 }];
  return zipSync(entries);
}
