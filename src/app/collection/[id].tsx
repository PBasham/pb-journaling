import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState, IconButton, Screen, Text } from '@/components/ui';
import {
  AddMenu,
  BookCard,
  BookGrid,
  ItemActions,
  NoteRow,
  SectionHeader,
  type ActionTarget,
} from '@/features/library/components';
import { useBooks, useCollection, useNotes, useSort } from '@/features/library/queries';
import { ItemLockGate } from '@/features/lock';
import { ItemTagRow } from '@/features/tags/components/ItemTagRow';
import { createStyles, itemColorValue, useTheme } from '@/theme';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const theme = useTheme();
  const { data: collection, loaded } = useCollection(id);
  const [bookSort, setBookSort] = useSort('books');
  const [noteSort, setNoteSort] = useSort('notes');
  const books = useBooks(id, bookSort);
  const notes = useNotes(id, noteSort);
  const [target, setTarget] = useState<ActionTarget | null>(null);

  if (loaded && !collection) {
    return (
      <Screen safeTop={false}>
        <EmptyState icon="albums-outline" title="This collection is gone" message="It may have been deleted." />
      </Screen>
    );
  }
  if (!collection) return null;

  const empty = books.loaded && notes.loaded && !books.data.length && !notes.data.length;

  return (
    <View style={styles.fill}>
      <Stack.Screen
        options={{
          title: collection.name,
          headerRight: () => (
            <IconButton
              icon="ellipsis-horizontal-circle-outline"
              label="Collection options"
              onPress={() => setTarget({ kind: 'collection', item: collection })}
            />
          ),
        }}
      />
      <ItemLockGate kind="collection" id={id} name={collection.name}>
        <Screen safeTop={false}>
          <View style={[styles.banner, { borderLeftColor: itemColorValue(theme, collection.color) }]}>
            <Text variant="label" color="textMuted" uppercase>
              Collection
            </Text>
            <Text variant="title">{collection.name}</Text>
          <ItemTagRow kind="collection" id={id} />
          </View>
  
          {empty ? (
            <EmptyState icon="albums-outline" title="Empty collection" message="Tap + to add a book or a note." />
          ) : null}
  
          {books.data.length ? (
            <View style={styles.section}>
              <SectionHeader title="Books" sort={bookSort} onSortChange={setBookSort} />
              <BookGrid>
                {books.data.map((b) => (
                  <BookCard
                    key={b.id}
                    book={b}
                    onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
                    onLongPress={() => setTarget({ kind: 'book', item: b })}
                  />
                ))}
              </BookGrid>
            </View>
          ) : null}
  
          {notes.data.length ? (
            <View style={styles.section}>
              <SectionHeader title="Notes" sort={noteSort} onSortChange={setNoteSort} />
              {notes.data.map((n) => (
                <NoteRow
                  key={n.id}
                  note={n}
                  onPress={() => router.push({ pathname: '/note/[id]', params: { id: n.id } })}
                  onLongPress={() => setTarget({ kind: 'note', item: n })}
                />
              ))}
            </View>
          ) : null}
          <View style={styles.fabSpace} />
        </Screen>
        <AddMenu kinds={['note', 'book', 'existing']} place={{ collectionId: id }} placeName={collection.name} />
      </ItemLockGate>
      <ItemActions
        target={target}
        onClose={() => setTarget(null)}
        onDeleted={(kind) => {
          if (kind === 'collection') router.back();
        }}
      />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  section: { gap: t.spacing.md },
  banner: { borderLeftWidth: 4, paddingLeft: t.spacing.md, gap: t.spacing.xxs, marginTop: t.spacing.sm },
  fabSpace: { height: 72 },
}));
