import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, IconButton, Screen, Text } from '@/components/ui';
import { AddMenu, ItemActions, NoteRow, SectionHeader, type ActionTarget } from '@/features/library/components';
import { useBook, useCollection, usePages } from '@/features/library/queries';
import { plural } from '@/lib/dates';
import { ItemLockGate } from '@/features/lock';
import { createStyles, itemColorValue, useTheme } from '@/theme';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const theme = useTheme();
  const { data: book, loaded } = useBook(id);
  const { data: collection } = useCollection(book?.collectionId ?? '');
  const pages = usePages(id);
  const [target, setTarget] = useState<ActionTarget | null>(null);

  if (loaded && !book) {
    return (
      <Screen safeTop={false}>
        <EmptyState icon="book-outline" title="This book is gone" message="It may have been deleted." />
      </Screen>
    );
  }
  if (!book) return null;

  return (
    <View style={styles.fill}>
      <Stack.Screen
        options={{
          title: book.name,
          headerRight: () => (
            <IconButton
              icon="ellipsis-horizontal-circle-outline"
              label="Book options"
              onPress={() => setTarget({ kind: 'book', item: book })}
            />
          ),
        }}
      />
      <ItemLockGate kind="book" id={id} name={book.name}>
        <Screen safeTop={false}>
          <View style={[styles.banner, { borderLeftColor: itemColorValue(theme, book.color) }]}>
            <Text variant="label" color="textMuted" uppercase>
              {collection ? `Book in ${collection.name}` : 'Book'}
            </Text>
            <Text variant="title">{book.name}</Text>
            <Text variant="caption" color="textMuted">
              {plural(pages.data.length, 'page')}
            </Text>
          </View>
  
          {pages.loaded && !pages.data.length ? (
            <EmptyState icon="document-outline" title="No pages yet" message="Tap + to write the first page." />
          ) : null}
  
          {pages.data.length ? (
            <View style={styles.section}>
              <View style={styles.pagesHeader}>
              <View style={styles.flex}>
                <SectionHeader title="Pages" />
              </View>
              {pages.data.length > 1 ? (
                <Button
                  title="Reorder"
                  icon="reorder-three-outline"
                  variant="ghost"
                  onPress={() => router.push({ pathname: '/book/reorder', params: { id } })}
                />
              ) : null}
            </View>
              {pages.data.map((p, i) => (
                <NoteRow
                  key={p.id}
                  note={p}
                  label={`${i + 1}.`}
                  onPress={() => router.push({ pathname: '/note/[id]', params: { id: p.id } })}
                  onLongPress={() => setTarget({ kind: 'note', item: p })}
                />
              ))}
              <Text variant="caption" color="textMuted" style={styles.hint}>
                Long press a page to move, lock or delete it.
              </Text>
            </View>
          ) : null}
          <View style={styles.fabSpace} />
        </Screen>
        <AddMenu kinds={['page']} place={{ bookId: id }} />
      </ItemLockGate>
      <ItemActions
        target={target}
        onClose={() => setTarget(null)}
        onDeleted={(kind) => {
          if (kind === 'book') router.back();
        }}
      />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  section: { gap: t.spacing.md },
  banner: { borderLeftWidth: 4, paddingLeft: t.spacing.md, gap: t.spacing.xxs, marginTop: t.spacing.sm },
  hint: { paddingHorizontal: t.spacing.xs },
  pagesHeader: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  fabSpace: { height: 72 },
}));
