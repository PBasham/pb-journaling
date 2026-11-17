import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { createStyles, itemColorValue, useTheme } from '@/theme';

import { useFavorites } from '../queries';

import { SectionHeader } from './SectionHeader';

interface Chip {
  key: string;
  label: string;
  color: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  href: Href;
}

/** Favorited collections, books and notes in one row for quick access. Hidden when there are none. */
export function FavoritesStrip() {
  const styles = useStyles();
  const theme = useTheme();
  const { data } = useFavorites();
  const chips: Chip[] = [
    ...data.collections.map<Chip>((c) => ({
      key: `c${c.id}`,
      label: c.name,
      color: c.color,
      icon: 'albums',
      href: { pathname: '/collection/[id]', params: { id: c.id } },
    })),
    ...data.books.map<Chip>((b) => ({
      key: `b${b.id}`,
      label: b.name,
      color: b.color,
      icon: 'book',
      href: { pathname: '/book/[id]', params: { id: b.id } },
    })),
    ...data.notes.map<Chip>((n) => ({
      key: `n${n.id}`,
      label: n.title || 'Untitled',
      color: n.color,
      icon: 'document-text',
      href: { pathname: '/note/[id]', params: { id: n.id } },
    })),
  ];
  if (!chips.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Favorites" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            accessibilityRole="button"
            accessibilityLabel={`Open ${chip.label}`}
            onPress={() => router.push(chip.href)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Ionicons name={chip.icon} size={16} color={itemColorValue(theme, chip.color)} />
            <Text variant="caption" numberOfLines={1} style={styles.label}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  section: { gap: t.spacing.md },
  row: { gap: t.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  label: { maxWidth: 160 },
  pressed: { opacity: 0.7 },
}));
