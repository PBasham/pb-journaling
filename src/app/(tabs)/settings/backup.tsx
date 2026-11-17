import { useState } from 'react';
import { View } from 'react-native';

import { Button, ConfirmDialog, ListGroup, ListRow, Screen, Section, Sheet, Text, TextField, Toggle } from '@/components/ui';
import { useDb } from '@/db';
import type { Book, Collection, Note } from '@/db/schema';
import { countExisting, readAllData, restoreData, SCHEMA_VERSION, type RestoreMode } from '@/features/backup/database';
import { backupKey, buildArchive, openBackupBytes, type OpenedArchive } from '@/features/backup/archive';
import { pickBackupBytes, shareBackup, shareMarkdown } from '@/features/backup/files';
import { collectPhotos, removeUnusedPhotos, restorePhotos } from '@/features/backup/photoBackup';
import {
  BackupError,
  buildBackup,
  decryptBackup,
  encryptBackup,
  fromPortableRow,
  parseBackup,
  PASSPHRASE_MIN,
  summarizeBackup,
  type BackupData,
  type EncryptedBackup,
} from '@/features/backup/format';
import { libraryToMarkdown } from '@/features/backup/markdown';
import { useLock } from '@/features/lock';
import { useSetting } from '@/features/settings/settings';
import { formatWhen, plural } from '@/lib/dates';
import { reportError, run, showInfo } from '@/lib/errors';
import { createStyles } from '@/theme';

/** What a picked backup holds, waiting for the person to choose how to restore it. */
interface Pending {
  data: BackupData;
  exportedAt: string;
  existing: number;
  archive: OpenedArchive;
  /** For an encrypted backup's photos. */
  key: Uint8Array | null;
}

/** A picked encrypted backup, waiting for its passphrase. */
interface Locked {
  file: EncryptedBackup;
  archive: OpenedArchive;
}

export default function BackupScreen() {
  const db = useDb();
  const styles = useStyles();
  const { suspendAutoLock } = useLock();
  const [lastBackupAt, setLastBackupAt] = useSetting('lastBackupAt');

  const [exportOpen, setExportOpen] = useState(false);
  const [protect, setProtect] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const [locked, setLocked] = useState<Locked | null>(null);
  const [openPassphrase, setOpenPassphrase] = useState('');
  const [openError, setOpenError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  /** Runs work that leaves the app for a moment (share sheet, file picker) without locking it. */
  const away = async (work: () => Promise<void>) => {
    const release = suspendAutoLock();
    try {
      await work();
    } finally {
      release();
    }
  };

  const passphraseError =
    protect && passphrase.length > 0 && passphrase.length < PASSPHRASE_MIN
      ? `At least ${PASSPHRASE_MIN} characters.`
      : protect && confirm.length > 0 && confirm !== passphrase
        ? "Those don't match."
        : null;
  const canExport = !busy && (!protect || (passphrase.length >= PASSPHRASE_MIN && confirm === passphrase));

  const exportBackup = async () => {
    setBusy(true);
    try {
      const { data, photos, missing } = await collectPhotos(await readAllData(db));
      const plain = buildBackup(data, SCHEMA_VERSION);
      const file = protect ? await encryptBackup(plain, passphrase) : plain;
      // With photos the backup is a zip; without, a single JSON file.
      const content = photos.length
        ? buildArchive(file, photos, file.encrypted ? await backupKey(file, passphrase) : null)
        : JSON.stringify(file);
      setExportOpen(false);
      setPassphrase('');
      setConfirm('');
      await away(() => shareBackup(content, file.encrypted));
      setLastBackupAt(Date.now());
      if (missing) showInfo(`${plural(missing, 'photo')} couldn't be found and were left out.`);
    } finally {
      setBusy(false);
    }
  };

  const exportMarkdown = async () => {
    const data = await readAllData(db);
    // Recently deleted stays out of the export.
    const kept = <T extends { deletedAt: Date | null }>(rows: T[]) => rows.filter((r) => !r.deletedAt);
    const markdown = libraryToMarkdown(
      {
        collections: kept(data.collections.map(fromPortableRow) as Collection[]),
        books: kept(data.books.map(fromPortableRow) as Book[]),
        notes: kept(data.notes.map(fromPortableRow) as Note[]),
      },
      { includeLocked: false },
    );
    await away(() => shareMarkdown(markdown));
  };

  const prepare = async (data: BackupData, exportedAt: string, archive: OpenedArchive, key: Uint8Array | null) => {
    setPending({ data, exportedAt, existing: await countExisting(db, data), archive, key });
  };

  const pickFile = async () => {
    let bytes: Uint8Array | null = null;
    await away(async () => {
      bytes = await pickBackupBytes();
    });
    if (bytes === null) return;
    try {
      const archive = openBackupBytes(bytes);
      const parsed = parseBackup(archive.text, SCHEMA_VERSION);
      if (parsed.encrypted) {
        setOpenPassphrase('');
        setOpenError(null);
        setLocked({ file: parsed, archive });
        return;
      }
      await prepare(parsed.data, parsed.exportedAt, archive, null);
    } catch (error) {
      if (error instanceof BackupError) reportError(error, error.message);
      else throw error;
    }
  };

  const openEncrypted = async () => {
    if (!locked) return;
    setBusy(true);
    try {
      const opened = await decryptBackup(locked.file, openPassphrase);
      const key = locked.archive.photos.size ? await backupKey(locked.file, openPassphrase) : null;
      setLocked(null);
      await prepare(opened.data, opened.exportedAt, locked.archive, key);
    } catch (error) {
      if (error instanceof BackupError) setOpenError(error.message);
      else throw error;
    } finally {
      setBusy(false);
    }
  };

  const restore = async (mode: RestoreMode) => {
    if (!pending) return;
    const counts = summarizeBackup(pending.data);
    setPending(null);
    setConfirmReplace(false);
    // Photos are written first, so no restored note points at a missing picture.
    const data = restorePhotos(pending.data, pending.archive, pending.key);
    await restoreData(db, data, mode);
    if (mode === 'replace') await removeUnusedPhotos(db);
    showInfo(
      mode === 'replace'
        ? 'Your library now matches the backup.'
        : `Added what was missing from the backup (${plural(counts.notes + counts.pages, 'note')} in it).`,
    );
  };

  const summary = pending ? summarizeBackup(pending.data) : null;

  return (
    <Screen safeTop={false}>
      <Section
        title="Back up"
        footer={`Last backup: ${lastBackupAt ? formatWhen(new Date(lastBackupAt)) : 'never'}. Your notes live only on this phone, so keep a copy somewhere else.`}>
        <ListGroup>
          <ListRow
            icon="cloud-upload-outline"
            title="Back up now"
            description="A file you can save to Drive, email or your computer"
            onPress={() => setExportOpen(true)}
          />
          <ListRow
            icon="document-text-outline"
            title="Export as Markdown"
            description="Readable anywhere. Locked items are listed by name only."
            onPress={() => run(exportMarkdown(), 'Could not export your notes.')}
            divider
          />
        </ListGroup>
      </Section>

      <Section title="Restore" footer="You choose whether to add to your library or replace it after picking the file.">
        <ListGroup>
          <ListRow
            icon="cloud-download-outline"
            title="Restore from a backup"
            onPress={() => run(pickFile(), 'Could not open that file.')}
          />
        </ListGroup>
      </Section>

      <Sheet visible={exportOpen} onClose={() => setExportOpen(false)}>
        <Text variant="heading">Back up your notes</Text>
        <ListGroup>
          <ListRow
            icon="shield-checkmark-outline"
            title="Protect with a passphrase"
            description="Recommended. Includes locked items, so only someone with the passphrase can read them."
            right={<Toggle accessibilityLabel="Protect with a passphrase" value={protect} onValueChange={setProtect} />}
          />
        </ListGroup>
        {protect ? (
          <View style={styles.fields}>
            <TextField
              label="Passphrase"
              value={passphrase}
              onChangeText={setPassphrase}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextField
              label="Confirm passphrase"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              hint={passphraseError ?? "There's no way to open the backup without it."}
              error={!!passphraseError}
            />
          </View>
        ) : null}
        <Button
          title="Save backup file"
          icon="share-outline"
          disabled={!canExport}
          loading={busy}
          onPress={() => run(exportBackup(), 'Could not make the backup.')}
        />
      </Sheet>

      <Sheet visible={locked !== null} onClose={() => setLocked(null)}>
        <Text variant="heading">This backup is protected</Text>
        <TextField
          label="Passphrase"
          value={openPassphrase}
          onChangeText={(text) => {
            setOpenError(null);
            setOpenPassphrase(text);
          }}
          secureTextEntry
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          hint={openError ?? undefined}
          error={!!openError}
          onSubmitEditing={() => run(openEncrypted(), 'Could not open the backup.')}
        />
        <Button
          title="Open backup"
          disabled={!openPassphrase || busy}
          loading={busy}
          onPress={() => run(openEncrypted(), 'Could not open the backup.')}
        />
      </Sheet>

      <Sheet visible={pending !== null && !confirmReplace} onClose={() => setPending(null)}>
        <Text variant="heading">Restore this backup?</Text>
        {pending && summary ? (
          <Text color="textMuted">
            Made {formatWhen(new Date(pending.exportedAt))}. It has {plural(summary.collections, 'collection')},{' '}
            {plural(summary.books, 'book')}, {plural(summary.pages, 'page')}, {plural(summary.notes, 'loose note')} and{' '}
            {plural(summary.photos, 'photo')}.
            {pending.existing ? ` ${pending.existing} of these are already in your library.` : ''}
          </Text>
        ) : null}
        <View style={styles.fields}>
          <Button title="Add to my library" onPress={() => run(restore('merge'), 'Could not restore the backup.')} />
          <Button title="Replace my library" variant="danger" onPress={() => setConfirmReplace(true)} />
          <Button title="Cancel" variant="ghost" onPress={() => setPending(null)} />
        </View>
      </Sheet>

      <ConfirmDialog
        visible={confirmReplace}
        title="Replace everything?"
        message="Everything in your library now is deleted and replaced with the backup. This can't be undone."
        confirmLabel="Replace"
        destructive
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => run(restore('replace'), 'Could not restore the backup.')}
      />
    </Screen>
  );
}

const useStyles = createStyles((t) => ({
  fields: { gap: t.spacing.md },
}));
