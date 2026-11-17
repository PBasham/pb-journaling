import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState, Screen } from '@/components/ui';
import {
  AddMenu,
  BookCard,
  BookGrid,
  CollectionCard,
  ItemActions,
  NoteRow,
  SectionHeader,
  type ActionTarget,
} from '@/features/library/components';
import { FavoritesStrip } from '@/features/library/components/FavoritesStrip';
import { useBooks, useCollections, useNotes, useSort } from '@/features/library/queries';
import { createStyles } from '@/theme';

/** The library: collections, then books and notes that aren't in a collection. */
export default function LibraryScreen() {
  const styles = useStyles();
  const [collectionSort, setCollectionSort] = useSort('collections');
  const [bookSort, setBookSort] = useSort('books');
  const [noteSort, setNoteSort] = useSort('notes');
  const collections = useCollections(collectionSort);
  const books = useBooks(null, bookSort);
  const notes = useNotes(null, noteSort);
  const [target, setTarget] = useState<ActionTarget | null>(null);

  const loaded = collections.loaded && books.loaded && notes.loaded;
  const empty = loaded && !collections.data.length && !books.data.length && !notes.data.length;

  return (
    <View style={styles.fill}>
      <Screen title="Library">
        {empty ? (
          <EmptyState
            icon="library-outline"
            title="Nothing here yet"
            message="Tap + to start a note, a book, or a collection to keep them in."
          />
        ) : null}

        <FavoritesStrip />

        {collections.data.length ? (
          <View style={styles.section}>
            <SectionHeader title="Collections" sort={collectionSort} onSortChange={setCollectionSort} />
            {collections.data.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                onPress={() => router.push({ pathname: '/collection/[id]', params: { id: c.id } })}
                onLongPress={() => setTarget({ kind: 'collection', item: c })}
              />
            ))}
          </View>
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
      <AddMenu kinds={['note', 'book', 'collection']} place={{ collectionId: null }} />
      <ItemActions target={target} onClose={() => setTarget(null)} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  section: { gap: t.spacing.md },
  fabSpace: { height: 72 },
}));
