import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, ConfirmDialog, EmptyState, ListGroup, ListRow, Screen, Sheet, Text } from '@/components/ui';
import { useDb } from '@/db';
import { deleteForever, emptyTrash, restoreDeleted, TRASH_DAYS, type TrashItem } from '@/features/library/library';
import { useTrash } from '@/features/library/queries';
import { plural } from '@/lib/dates';
import { run, showInfo } from '@/lib/errors';
import { createStyles, itemColorValue, useTheme } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

const icons = { collection: 'albums', book: 'book', note: 'document-text' } as const;

function daysLeft(item: TrashItem, now = Date.now()): number {
  return Math.max(0, Math.ceil((item.deletedAt.getTime() + TRASH_DAYS * DAY_MS - now) / DAY_MS));
}

function describe(item: TrashItem): string {
  const parts = [
    item.contains.books ? plural(item.contains.books, 'book') : '',
    item.contains.pages ? plural(item.contains.pages, 'page') : '',
    item.contains.notes ? plural(item.contains.notes, 'note') : '',
  ].filter(Boolean);
  const left = daysLeft(item);
  const when = left <= 1 ? 'Gone for good tomorrow' : `${left} days left`;
  return parts.length ? `With ${parts.join(', ')} · ${when}` : when;
}

export default function TrashScreen() {
  const db = useDb();
  const styles = useStyles();
  const { data: items, loaded } = useTrash();
  const [selected, setSelected] = useState<TrashItem | null>(null);
  const [confirmForever, setConfirmForever] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const restore = (item: TrashItem) => {
    setSelected(null);
    run(
      restoreDeleted(db, item.kind, item.id).then(() => showInfo(`Restored ${item.name}.`)),
      'Could not restore it.',
    );
  };

  return (
    <Screen safeTop={false}>
      <Text color="textMuted">
        Deleted collections, books and notes stay here for {TRASH_DAYS} days, then they&apos;re removed for good.
      </Text>

      {loaded && !items.length ? (
        <EmptyState icon="trash-outline" title="Nothing here" message="Things you delete show up here for 30 days." />
      ) : null}

      {items.length ? (
        <>
          <View style={styles.list}>
            {items.map((item) => (
              <TrashRow key={`${item.kind}-${item.id}`} item={item} onPress={() => setSelected(item)} />
            ))}
          </View>
          <Button title="Empty Recently deleted" variant="danger" icon="trash-outline" onPress={() => setConfirmEmpty(true)} />
        </>
      ) : null}

      <Sheet visible={selected !== null && !confirmForever} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <Text variant="heading" numberOfLines={1}>
              {selected.name}
            </Text>
            <Text color="textMuted">{describe(selected)}</Text>
            <ListGroup>
              <ListRow icon="arrow-undo-outline" title="Restore" onPress={() => restore(selected)} />
              <ListRow icon="trash-outline" title="Delete for good" destructive divider onPress={() => setConfirmForever(true)} />
            </ListGroup>
          </>
        ) : null}
      </Sheet>

      <ConfirmDialog
        visible={confirmForever && selected !== null}
        title={`Delete “${selected?.name ?? ''}” for good?`}
        message="This can't be undone."
        confirmLabel="Delete for good"
        destructive
        onCancel={() => setConfirmForever(false)}
        onConfirm={() => {
          const item = selected;
          setConfirmForever(false);
          setSelected(null);
          if (item) run(deleteForever(db, item.kind, item.id), 'Could not delete it.');
        }}
      />

      <ConfirmDialog
        visible={confirmEmpty}
        title="Empty Recently deleted?"
        message={`${plural(items.length, 'item')} will be deleted for good. This can't be undone.`}
        confirmLabel="Empty"
        destructive
        onCancel={() => setConfirmEmpty(false)}
        onConfirm={() => {
          setConfirmEmpty(false);
          run(emptyTrash(db), 'Could not empty Recently deleted.');
        }}
      />
    </Screen>
  );
}

function TrashRow({ item, onPress }: { item: TrashItem; onPress: () => void }) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${describe(item)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name={icons[item.kind]} size={20} color={itemColorValue(theme, item.color)} />
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
            {item.name}
          </Text>
          {item.isLocked ? <Ionicons name="lock-closed" size={14} color={theme.colors.textMuted} /> : null}
        </View>
        <Text variant="caption" color="textMuted">
          {describe(item)}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  list: { gap: t.spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
}));
