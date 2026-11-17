import { useState } from 'react';

import { ConfirmDialog, ListGroup, ListRow, Screen, Section, Text } from '@/components/ui';
import { useDb } from '@/db';
import { useLive } from '@/db/useLive';
import { clearAllLocks, purgeOldTrash } from '@/features/library/library';
import { useLock } from '@/features/lock';
import { countEverything, createBulkData, createOldDeletedNote, createSampleLibrary, eraseLibrary } from '@/features/sample/sample';
import { run, showInfo } from '@/lib/errors';

type Danger = 'erase' | 'lock' | null;

/** Tools for testing the app on a phone. Only in the development build (see `lib/devTools`). */
export default function DeveloperScreen() {
  const db = useDb();
  const { config, removeLock } = useLock();
  const [busy, setBusy] = useState<string | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const { data: counts } = useLive(
    () => countEverything(db),
    ['collections', 'books', 'notes', 'tags', 'templates', 'note_photos'],
    [db],
    { collections: 0, books: 0, notes: 0, tags: 0, templates: 0, photos: 0 },
  );

  const task = (label: string, work: () => Promise<unknown>, done: string) => {
    if (busy) return;
    setBusy(label);
    run(
      work()
        .then(() => showInfo(done))
        .finally(() => setBusy(null)),
      `Could not ${label.toLowerCase()}.`,
    );
  };

  return (
    <Screen safeTop={false}>
      <Text color="textMuted">Only in the development build. Nothing here exists in the store version.</Text>

      <Section title="In the database">
        <ListGroup>
          <ListRow title="Collections" value={String(counts.collections)} />
          <ListRow title="Books" value={String(counts.books)} divider />
          <ListRow title="Notes and pages" value={String(counts.notes)} description="Includes Recently deleted" divider />
          <ListRow title="Tags" value={String(counts.tags)} divider />
          <ListRow title="Templates" value={String(counts.templates)} divider />
          <ListRow title="Photos" value={String(counts.photos)} divider />
        </ListGroup>
      </Section>

      <Section title="Generate" footer={busy ? `Working: ${busy}…` : 'Adds to what is already there.'}>
        <ListGroup>
          <ListRow
            icon="sparkles-outline"
            title="Add example library"
            description="Recipes, Work, a trip book, tags, a favorite and a pin"
            onPress={() => task('Add example library', () => createSampleLibrary(db), 'Example library added.')}
          />
          <ListRow
            icon="layers-outline"
            title="Add lots of test data"
            description="20 collections, 100 books, 1,000 pages, 200 notes. Takes a moment"
            divider
            onPress={() => task('Add test data', () => createBulkData(db), 'Test data added.')}
          />
          <ListRow
            icon="time-outline"
            title="Add deleted notes (29 and 31 days old)"
            description="Checks the 30 day clean up in Recently deleted"
            divider
            onPress={() =>
              task(
                'Add old deleted notes',
                async () => {
                  await createOldDeletedNote(db, 29);
                  await createOldDeletedNote(db, 31);
                },
                'Added two old deleted notes.',
              )
            }
          />
          <ListRow
            icon="refresh-outline"
            title="Run the 30 day clean up now"
            divider
            onPress={() => task('Run clean up', () => purgeOldTrash(db), 'Clean up done.')}
          />
        </ListGroup>
      </Section>

      <Section title="Reset">
        <ListGroup>
          <ListRow
            icon="lock-open-outline"
            title="Remove PIN or password without it"
            description="Also unlocks every item"
            destructive
            onPress={() => (config ? setDanger('lock') : showInfo('No PIN or password is set.'))}
          />
          <ListRow icon="nuclear-outline" title="Erase the whole library" description="Settings stay" destructive divider onPress={() => setDanger('erase')} />
        </ListGroup>
      </Section>

      <ConfirmDialog
        visible={danger === 'erase'}
        title="Erase everything?"
        message="Every collection, book, note, tag, photo and saved template is deleted for good."
        confirmLabel="Erase"
        destructive
        onCancel={() => setDanger(null)}
        onConfirm={() => {
          setDanger(null);
          task('Erase library', () => eraseLibrary(db), 'Library erased.');
        }}
      />
      <ConfirmDialog
        visible={danger === 'lock'}
        title="Remove the lock?"
        message="The PIN or password is removed and every locked item is unlocked."
        confirmLabel="Remove"
        destructive
        onCancel={() => setDanger(null)}
        onConfirm={() => {
          setDanger(null);
          task(
            'Remove lock',
            async () => {
              await clearAllLocks(db);
              await removeLock();
            },
            'Lock removed.',
          );
        }}
      />
    </Screen>
  );
}
