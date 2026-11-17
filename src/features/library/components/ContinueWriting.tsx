import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatWhen } from '@/lib/dates';
import { createStyles, itemColorValue, useTheme } from '@/theme';

import { previewText } from '../../editor/document';
import { useRecentlyOpened } from '../queries';

import { SectionHeader } from './SectionHeader';

/** The notes opened last, so picking up where you left off is one tap. Hidden until there are some. */
export function ContinueWriting() {
  const styles = useStyles();
  const theme = useTheme();
  const { data: notes } = useRecentlyOpened();
  if (!notes.length) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title="Continue writing" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {notes.map((note) => {
          const title = note.title || 'Untitled';
          // A locked note's text never shows outside its own screen.
          const preview = note.isLocked ? '' : previewText(note.contentText, 70);
          return (
            <Pressable
              key={note.id}
              accessibilityRole="button"
              accessibilityLabel={`Continue ${title}${note.isLocked ? ', locked' : ''}`}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: itemColorValue(theme, note.color) }]} />
                <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                  {title}
                </Text>
                {note.isLocked ? <Ionicons name="lock-closed" size={13} color={theme.colors.textMuted} /> : null}
              </View>
              <Text variant="caption" color="textMuted" numberOfLines={2} style={styles.preview}>
                {preview || ' '}
              </Text>
              <Text variant="caption" color="textMuted">
                {note.lastOpenedAt ? formatWhen(note.lastOpenedAt) : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 168;

const useStyles = createStyles((t) => ({
  section: { gap: t.spacing.md },
  row: { gap: t.spacing.sm },
  card: {
    width: CARD_WIDTH,
    padding: t.spacing.md,
    gap: t.spacing.xs,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  dot: { width: 8, height: 8, borderRadius: t.radius.pill },
  preview: { minHeight: t.typography.caption.lineHeight * 2 },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
}));
