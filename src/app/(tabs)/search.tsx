import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components/ui';
import { useDb } from '@/db';
import { useLive } from '@/db/useLive';
import { SectionHeader } from '@/features/library/components';
import { searchLibrary, type SearchResults } from '@/features/library/library';
import { createStyles, itemColorValue, useTheme } from '@/theme';

const DEBOUNCE_MS = 200;
const empty: SearchResults = { collections: [], books: [], notes: [] };

export default function SearchScreen() {
  const db = useDb();
  const styles = useStyles();
  const theme = useTheme();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const { data, loaded } = useLive(() => searchLibrary(db, query), ['collections', 'books', 'notes'], [db, query], empty);
  const total = data.collections.length + data.books.length + data.notes.length;

  return (
    <Screen title="Search">
      <View style={styles.field}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Titles, names and text"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          accessibilityLabel="Search"
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {text ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setText('')}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {!query ? (
        <EmptyState
          icon="search-outline"
          title="Search your library"
          message="Finds collections, books, pages and notes. Locked items are never searched."
        />
      ) : loaded && total === 0 ? (
        <EmptyState icon="search-outline" title={`Nothing found for “${query}”`} message="Locked items are not searched." />
      ) : null}

      {data.collections.length ? (
        <View style={styles.section}>
          <SectionHeader title="Collections" />
          {data.collections.map((c) => (
            <ResultRow
              key={c.id}
              icon="albums"
              color={itemColorValue(theme, c.color)}
              title={c.name}
              onPress={() => router.push({ pathname: '/collection/[id]', params: { id: c.id } })}
            />
          ))}
        </View>
      ) : null}

      {data.books.length ? (
        <View style={styles.section}>
          <SectionHeader title="Books" />
          {data.books.map((b) => (
            <ResultRow
              key={b.id}
              icon="book"
              color={itemColorValue(theme, b.color)}
              title={b.name}
              onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
            />
          ))}
        </View>
      ) : null}

      {data.notes.length ? (
        <View style={styles.section}>
          <SectionHeader title="Notes and pages" />
          {data.notes.map((n) => (
            <ResultRow
              key={n.id}
              icon={n.bookId ? 'document' : 'document-text'}
              color={itemColorValue(theme, n.color)}
              title={n.title || 'Untitled'}
              snippet={n.snippet}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: n.id } })}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function ResultRow({
  icon,
  color,
  title,
  snippet,
  onPress,
}: {
  icon: 'albums' | 'book' | 'document' | 'document-text';
  color: string;
  title: string;
  snippet?: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${snippet ? `, ${snippet}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={color} style={styles.icon} />
      <View style={styles.flex}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {snippet ? (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {snippet}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing.md,
  },
  input: { ...t.typography.body, flex: 1, color: t.colors.text, paddingVertical: t.spacing.md },
  section: { gap: t.spacing.sm },
  row: {
    flexDirection: 'row',
    gap: t.spacing.md,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.md,
  },
  icon: { marginTop: t.spacing.xxs },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
}));
