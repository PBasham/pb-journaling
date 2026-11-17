import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui';
import { createStyles, itemColorValue, useTheme } from '@/theme';

interface TagChipProps {
  name: string;
  color?: string;
  selected?: boolean;
  /** Shows a plus icon instead of a dot, for "Add tag". */
  add?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function TagChip({ name, color, selected, add, onPress, accessibilityLabel }: TagChipProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Tag ${name}`}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      {add ? (
        <Ionicons name="add" size={14} color={theme.colors.primary} />
      ) : (
        <Text variant="caption" style={{ color: itemColorValue(theme, color) }}>
          #
        </Text>
      )}
      <Text variant="caption" color={add || selected ? 'primary' : 'text'}>
        {name}
      </Text>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xxs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  selected: { backgroundColor: t.colors.primarySoft },
  pressed: { opacity: 0.7 },
}));
