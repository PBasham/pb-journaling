import { Pressable, View } from 'react-native';

import { createStyles } from '@/theme';

import { Text } from './Text';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}>
            <Text variant="bodyStrong" color={selected ? 'text' : 'textMuted'} align="center">
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  track: {
    flexDirection: 'row',
    backgroundColor: t.colors.surfaceMuted,
    borderRadius: t.radius.md,
    padding: t.spacing.xs,
    gap: t.spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.sm,
  },
  selected: {
    backgroundColor: t.colors.surface,
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
}));
