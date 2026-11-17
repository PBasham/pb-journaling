import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ListGroup, ListRow, Sheet, Text, TextField } from '@/components/ui';
import { useDb } from '@/db';
import { useLive } from '@/db/useLive';
import { plural } from '@/lib/dates';
import { run, showInfo } from '@/lib/errors';
import { createStyles, itemColorValue, useTheme } from '@/theme';

import { listMoveCandidates, moveItemsInto, type MoveCandidate, type NotePlace } from '../library';

interface BringInSheetProps {
  /** Where things are brought: a collection, or a book (as pages). */
  target: NotePlace;
  /** "Recipes", for the sheet's title. */
  targetName: string;
  visible: boolean;
  onClose: () => void;
}

/** Pick books, notes or pages from anywhere and move them here in one go. */
export function BringInSheet({ target, targetName, visible, onClose }: BringInSheetProps) {
  const db = useDb();
  const styles = useStyles();
  const theme = useTheme();
  const intoBook = !!target.bookId;
  const [filter, setFilter] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setFilter('');
      setPicked([]);
    }
  }

  const { data: candidates } = useLive(
    () => (visible ? listMoveCandidates(db, target) : Promise.resolve([] as MoveCandidate[])),
    ['collections', 'books', 'notes'],
    [db, visible, target.bookId, target.collectionId],
    [] as MoveCandidate[],
  );
  const term = filter.trim().toLowerCase();
  const shown = term ? candidates.filter((c) => c.name.toLowerCase().includes(term)) : candidates;
  const groups: [string, MoveCandidate[]][] = [
    ['Books', shown.filter((c) => c.kind === 'book')],
    ['Notes', shown.filter((c) => c.kind === 'note' && !c.isPage)],
    ['Pages in other books', shown.filter((c) => c.isPage)],
  ];
  const key = (c: MoveCandidate) => `${c.kind}:${c.id}`;
  const toggle = (c: MoveCandidate) =>
    setPicked((p) => (p.includes(key(c)) ? p.filter((k) => k !== key(c)) : [...p, key(c)]));

  const move = () => {
    const items = picked.map((k) => {
      const [kind, id] = k.split(':') as ['book' | 'note', string];
      return { kind, id };
    });
    onClose();
    run(
      moveItemsInto(db, target, items).then(() => showInfo(`Moved ${plural(items.length, 'item')} to ${targetName}.`)),
      'Could not move them.',
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="heading">{intoBook ? `Add pages to ${targetName}` : `Bring into ${targetName}`}</Text>
      <Text color="textMuted">
        {intoBook
          ? 'Notes and pages you pick become pages at the end of this book.'
          : 'Books, notes and pages you pick move into this collection. Pages become loose notes.'}
      </Text>
      <TextField value={filter} onChangeText={setFilter} placeholder="Filter by name" accessibilityLabel="Filter by name" />
      <ScrollView style={styles.list} contentContainerStyle={styles.groups}>
        {candidates.length === 0 ? <Text color="textMuted">Nothing else to bring in.</Text> : null}
        {groups.map(([title, items]) =>
          items.length ? (
            <View key={title} style={styles.group}>
              <Text variant="label" color="textMuted" uppercase>
                {title}
              </Text>
              <ListGroup>
                {items.map((c, i) => {
                  const on = picked.includes(key(c));
                  return (
                    <ListRow
                      key={key(c)}
                      icon={c.kind === 'book' ? 'book-outline' : c.isPage ? 'document-outline' : 'document-text-outline'}
                      title={c.name}
                      description={c.isLocked ? `${c.where} · Locked` : c.where}
                      divider={i > 0}
                      onPress={() => toggle(c)}
                      right={
                        on ? (
                          <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={22} color={itemColorValue(theme, c.color)} />
                        )
                      }
                    />
                  );
                })}
              </ListGroup>
            </View>
          ) : null,
        )}
      </ScrollView>
      <Button
        title={picked.length ? `Move ${plural(picked.length, 'item')} here` : 'Pick what to move'}
        disabled={!picked.length}
        onPress={move}
      />
    </Sheet>
  );
}

const useStyles = createStyles((t) => ({
  list: { maxHeight: 380 },
  groups: { gap: t.spacing.md },
  group: { gap: t.spacing.sm },
}));
