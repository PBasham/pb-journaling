import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import type Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, ListGroup, ListRow, Sheet, Text } from '@/components/ui';
import { useDb } from '@/db';
import { run } from '@/lib/errors';
import { createStyles, useTheme } from '@/theme';

import { createBook, createCollection, createNote, type NotePlace } from '../library';

import { ItemFormSheet } from './ItemFormSheet';

type Kind = 'note' | 'book' | 'collection' | 'page';

const options: Record<Kind, { title: string; description: string; icon: ComponentProps<typeof Ionicons>['name'] }> = {
  note: { title: 'Note', description: 'A single loose page', icon: 'document-text-outline' },
  page: { title: 'Page', description: 'Add a page to the end of this book', icon: 'document-outline' },
  book: { title: 'Book', description: 'Pages kept together in order', icon: 'book-outline' },
  collection: { title: 'Collection', description: 'A home for books and notes', icon: 'albums-outline' },
};

interface AddMenuProps {
  /** What can be added here, in menu order. With one choice the button adds it straight away. */
  kinds: Kind[];
  /** Where new items go. */
  place: NotePlace;
}

/** The round + button in the corner, and the flows behind it. */
export function AddMenu({ kinds, place }: AddMenuProps) {
  const db = useDb();
  const styles = useStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<'book' | 'collection' | null>(null);

  const start = (kind: Kind) => {
    setMenuOpen(false);
    if (kind === 'book' || kind === 'collection') {
      setForm(kind);
      return;
    }
    run(
      createNote(db, place).then((id) => router.push({ pathname: '/note/[id]', params: { id, isNew: '1' } })),
      'Could not create the note.',
    );
  };

  return (
    <>
      <View style={[styles.fab, { bottom: insets.bottom + theme.spacing.xl }]}>
        <IconButton
          icon="add"
          label={kinds.length === 1 ? `New ${options[kinds[0]].title.toLowerCase()}` : 'Add'}
          filled
          large
          onPress={() => (kinds.length === 1 ? start(kinds[0]) : setMenuOpen(true))}
        />
      </View>
      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <Text variant="heading">New</Text>
        <ListGroup>
          {kinds.map((kind, i) => (
            <ListRow
              key={kind}
              icon={options[kind].icon}
              title={options[kind].title}
              description={options[kind].description}
              divider={i > 0}
              onPress={() => start(kind)}
            />
          ))}
        </ListGroup>
      </Sheet>
      <ItemFormSheet
        visible={form !== null}
        title={form === 'collection' ? 'New collection' : 'New book'}
        saveLabel="Create"
        onClose={() => setForm(null)}
        onSave={({ name, color }) => {
          const kind = form;
          setForm(null);
          if (kind === 'collection') {
            run(
              createCollection(db, { name, color }).then((id) =>
                router.push({ pathname: '/collection/[id]', params: { id } }),
              ),
              'Could not create the collection.',
            );
          } else {
            const collectionId = place.bookId ? null : (place.collectionId ?? null);
            run(
              createBook(db, { name, color, collectionId }).then((id) =>
                router.push({ pathname: '/book/[id]', params: { id } }),
              ),
              'Could not create the book.',
            );
          }
        }}
      />
    </>
  );
}

const useStyles = createStyles((t) => ({
  fab: {
    position: 'absolute',
    right: t.spacing.xl,
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderRadius: t.radius.pill,
  },
}));
