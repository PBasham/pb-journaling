import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Today as YYYY-MM-DD in local time, for file names. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Writes a file to the app's cache and opens the share sheet, so the person picks where it goes
 * (Drive, email, Files). The app never uploads anything itself.
 */
async function shareText(name: string, text: string | Uint8Array, mimeType: string, dialogTitle: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
}

/** Shares a backup: plain JSON, or a zip when it has photos. */
export function shareBackup(content: string | Uint8Array, encrypted: boolean): Promise<void> {
  const zip = typeof content !== 'string';
  return shareText(
    `pb-notes-backup-${today()}${encrypted ? '-encrypted' : ''}.${zip ? 'zip' : 'json'}`,
    content,
    zip ? 'application/zip' : 'application/json',
    'Save your backup somewhere off this phone',
  );
}

/** Shares one note as a Markdown text file. */
export function shareNoteFile(title: string, markdown: string): Promise<void> {
  const safe = (title || 'note').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'note';
  return shareText(`${safe}.md`, markdown, 'text/markdown', 'Share this note');
}

export function shareMarkdown(markdown: string): Promise<void> {
  return shareText(`pb-notes-${today()}.md`, markdown, 'text/markdown', 'Save your notes as Markdown');
}

/** Opens the system file picker. Returns the file's bytes (zip or JSON), or null if cancelled. */
export async function pickBackupBytes(): Promise<Uint8Array | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/zip', 'application/json', 'text/plain', '*/*'] });
  if (picked.canceled) return null;
  return picked.result.bytes();
}
