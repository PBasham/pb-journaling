import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Note } from '@/db/schema';
import { formatWhen, plural } from '@/lib/dates';
import { createStyles, itemColorValue, useTheme } from '@/theme';

import { previewText } from '../../editor/document';
import type { BookWithCounts, CollectionWithCounts } from '../library';

interface PressProps {
  onPress: () => void;
  onLongPress?: () => void;
}

function FavoriteMark({ on }: { on: boolean }) {
  const theme = useTheme();
  if (!on) return null;
  return <Ionicons name="star" size={14} color={theme.colors.primary} accessibilityLabel="Favorite" />;
}

export function CollectionCard({ collection, onPress, onLongPress }: { collection: CollectionWithCounts } & PressProps) {
  const styles = useStyles();
  const theme = useTheme();
  const counts = `${plural(collection.bookCount, 'book')} · ${plural(collection.noteCount, 'note')}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Collection ${collection.name}, ${counts}`}
      accessibilityHint="Opens the collection. Long press for options."
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.colorBar, { backgroundColor: itemColorValue(theme, collection.color) }]} />
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Ionicons name="albums-outline" size={18} color={itemColorValue(theme, collection.color)} />
          <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
            {collection.name}
          </Text>
          <FavoriteMark on={collection.isFavorite} />
        </View>
        <View style={styles.metaRow}>
          <Text variant="caption" color="textMuted" style={styles.flex}>
            {counts}
          </Text>
          <Text variant="caption" color="textMuted">
            {formatWhen(collection.updatedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function BookCard({ book, onPress, onLongPress }: { book: BookWithCounts } & PressProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Book ${book.name}, ${plural(book.pageCount, 'page')}`}
      accessibilityHint="Opens the book. Long press for options."
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.book, pressed && styles.pressed]}>
      <View style={[styles.spine, { backgroundColor: itemColorValue(theme, book.color) }]} />
      <View style={styles.bookBody}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={2} style={styles.flex}>
            {book.name}
          </Text>
          <FavoriteMark on={book.isFavorite} />
        </View>
        <Text variant="caption" color="textMuted">
          {plural(book.pageCount, 'page')}
        </Text>
        <Text variant="caption" color="textMuted">
          {formatWhen(book.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

/** A grid of books, two per row. */
export function BookGrid({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.grid}>{children}</View>;
}

export function NoteRow({
  note,
  label,
  onPress,
  onLongPress,
}: { note: Note; /** Shown before the title, like a page number. */ label?: string } & PressProps) {
  const styles = useStyles();
  const theme = useTheme();
  const title = note.title || 'Untitled';
  const preview = previewText(note.contentText);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label ? `${label}, ` : ''}${title}${preview ? `, ${preview}` : ''}`}
      accessibilityHint="Opens it. Long press for options."
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.note, pressed && styles.pressed]}>
      <View style={[styles.dot, { backgroundColor: itemColorValue(theme, note.color) }]} />
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          {label ? (
            <Text variant="caption" color="textMuted">
              {label}
            </Text>
          ) : null}
          <Text variant="bodyStrong" numberOfLines={1} color={note.title ? 'text' : 'textMuted'} style={styles.flex}>
            {title}
          </Text>
          <FavoriteMark on={note.isFavorite} />
          <Text variant="caption" color="textMuted">
            {formatWhen(note.updatedAt)}
          </Text>
        </View>
        {preview ? (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {preview}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  colorBar: { height: 6 },
  cardBody: { padding: t.spacing.lg, gap: t.spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
  book: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
    flexDirection: 'row',
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  spine: { width: 14 },
  bookBody: { flex: 1, padding: t.spacing.md, gap: t.spacing.xxs },
  note: {
    flexDirection: 'row',
    gap: t.spacing.md,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: t.radius.pill, marginTop: 6 },
}));
