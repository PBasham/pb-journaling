/**
 * Backup file format. Pure functions only (no database or file access), so it is easy to test.
 *
 * A backup is JSON. Plain backups hold the data directly. Encrypted backups hold the same data
 * encrypted with AES-256-GCM, using a key derived from the person's passphrase with PBKDF2-SHA256.
 */
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToUtf8, utf8ToBytes } from '@noble/ciphers/utils.js';

import { base64ToBytes, bytesToBase64, deriveKey, randomBytes } from '@/lib/crypto';

export const BACKUP_APP = 'pb-notes';
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_KDF_ITERATIONS = 100_000;
export const PASSPHRASE_MIN = 8;

/** Tables in insert order: parents before the rows that reference them. */
export const backupTables = ['collections', 'books', 'notes', 'settings'] as const;

export type BackupTable = (typeof backupTables)[number];
export type PortableRow = Record<string, unknown>;
export type BackupData = Record<BackupTable, PortableRow[]>;

interface BackupHeader {
  app: typeof BACKUP_APP;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  /** Number of database migrations the exporting app had. */
  schemaVersion: number;
  exportedAt: string;
}

export interface PlainBackup extends BackupHeader {
  encrypted: false;
  data: BackupData;
}

export interface EncryptedBackup extends BackupHeader {
  encrypted: true;
  kdf: { name: 'pbkdf2-sha256'; iterations: number; salt: string };
  cipher: 'aes-256-gcm';
  nonce: string;
  /** Base64 of the encrypted JSON `data`. */
  payload: string;
}

export type BackupFile = PlainBackup | EncryptedBackup;

/** A problem with a backup file, with a message to show the person. */
export class BackupError extends Error {}

const DATE_COLUMNS = new Set(['createdAt', 'updatedAt']);

/** Database row to JSON safe row. Dates become epoch milliseconds. */
export function toPortableRow(row: object): PortableRow {
  const out: PortableRow = {};
  for (const [key, value] of Object.entries(row)) out[key] = value instanceof Date ? value.getTime() : value;
  return out;
}

/** JSON row back to a database row. Timestamp columns become Dates again. */
export function fromPortableRow(row: PortableRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = DATE_COLUMNS.has(key) && typeof value === 'number' ? new Date(value) : value;
  }
  return out;
}

export function buildBackup(data: BackupData, schemaVersion: number, now = new Date()): PlainBackup {
  return {
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion,
    exportedAt: now.toISOString(),
    encrypted: false,
    data,
  };
}

export async function encryptBackup(
  backup: PlainBackup,
  passphrase: string,
  iterations = BACKUP_KDF_ITERATIONS,
): Promise<EncryptedBackup> {
  if (passphrase.length < PASSPHRASE_MIN) {
    throw new BackupError(`Passphrase must be at least ${PASSPHRASE_MIN} characters.`);
  }
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const key = await deriveKey(passphrase, salt, iterations);
  const ciphertext = gcm(key, nonce).encrypt(utf8ToBytes(JSON.stringify(backup.data)));
  const { data: _data, encrypted: _encrypted, ...header } = backup;
  return {
    ...header,
    encrypted: true,
    kdf: { name: 'pbkdf2-sha256', iterations, salt: bytesToBase64(salt) },
    cipher: 'aes-256-gcm',
    nonce: bytesToBase64(nonce),
    payload: bytesToBase64(ciphertext),
  };
}

export async function decryptBackup(backup: EncryptedBackup, passphrase: string): Promise<PlainBackup> {
  const key = await deriveKey(passphrase, base64ToBytes(backup.kdf.salt), backup.kdf.iterations);
  let json: string;
  try {
    json = bytesToUtf8(gcm(key, base64ToBytes(backup.nonce)).decrypt(base64ToBytes(backup.payload)));
  } catch {
    throw new BackupError('That passphrase does not open this backup.');
  }
  const data = JSON.parse(json) as unknown;
  validateData(data);
  const { kdf: _kdf, cipher: _cipher, nonce: _nonce, payload: _payload, encrypted: _e, ...header } = backup;
  return { ...header, encrypted: false, data };
}

/** Parses and checks a backup file's text. Throws BackupError with a message for the person. */
export function parseBackup(text: string, currentSchemaVersion: number): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('This file is not a PB Notes backup.');
  }
  if (!isObject(parsed) || parsed.app !== BACKUP_APP) throw new BackupError('This file is not a PB Notes backup.');
  if (parsed.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new BackupError('This backup was made by a different version of the app.');
  }
  if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion > currentSchemaVersion) {
    throw new BackupError('This backup was made by a newer version of the app. Update the app first.');
  }
  if (parsed.encrypted === true) {
    const ok =
      isObject(parsed.kdf) &&
      parsed.kdf.name === 'pbkdf2-sha256' &&
      typeof parsed.kdf.iterations === 'number' &&
      typeof parsed.kdf.salt === 'string' &&
      parsed.cipher === 'aes-256-gcm' &&
      typeof parsed.nonce === 'string' &&
      typeof parsed.payload === 'string';
    if (!ok) throw new BackupError('This backup file is damaged.');
    return parsed as unknown as EncryptedBackup;
  }
  validateData(parsed.data);
  return parsed as unknown as PlainBackup;
}

function validateData(data: unknown): asserts data is BackupData {
  if (!isObject(data)) throw new BackupError('This backup file is damaged.');
  for (const table of backupTables) {
    const rows = data[table];
    if (!Array.isArray(rows) || !rows.every(isObject)) throw new BackupError('This backup file is damaged.');
  }
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Counts for showing what a backup holds. */
export function summarizeBackup(data: BackupData) {
  const pages = data.notes.filter((n) => typeof n.bookId === 'string').length;
  return {
    collections: data.collections.length,
    books: data.books.length,
    pages,
    notes: data.notes.length - pages,
  };
}
