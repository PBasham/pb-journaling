import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Template } from '@/db/schema';
import { createStyles, useTheme } from '@/theme';

import { useTemplates } from '../queries';

/** "Start from a template" chips, shown on a new, empty note. */
export function TemplateRow({ onPick }: { onPick: (template: Template) => void }) {
  const styles = useStyles();
  const theme = useTheme();
  const { data: templates } = useTemplates();
  if (!templates.length) return null;
  return (
    <View style={styles.wrap}>
      <Text variant="caption" color="textMuted" style={styles.label}>
        Start from a template
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.row}>
        {templates.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={`Template ${t.name}`}
            onPress={() => onPick(t)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Ionicons name={t.isBuiltIn ? 'document-text-outline' : 'bookmark-outline'} size={15} color={theme.colors.primary} />
            <Text variant="caption">{t.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { gap: t.spacing.xs, paddingBottom: t.spacing.sm },
  label: { paddingHorizontal: t.spacing.lg },
  row: { gap: t.spacing.sm, paddingHorizontal: t.spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  pressed: { opacity: 0.7 },
}));
