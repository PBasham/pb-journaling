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
async function shareText(name: string, text: string, mimeType: string, dialogTitle: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
}

export function shareBackup(json: string, encrypted: boolean): Promise<void> {
  return shareText(
    `pb-notes-backup-${today()}${encrypted ? '-encrypted' : ''}.json`,
    json,
    'application/json',
    'Save your backup somewhere off this phone',
  );
}

export function shareMarkdown(markdown: string): Promise<void> {
  return shareText(`pb-notes-${today()}.md`, markdown, 'text/markdown', 'Save your notes as Markdown');
}

/** Opens the system file picker. Returns the file's text, or null if cancelled. */
export async function pickBackupText(): Promise<string | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', '*/*'] });
  if (picked.canceled) return null;
  return picked.result.text();
}
