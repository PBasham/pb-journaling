import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { createStyles, useTheme } from '@/theme';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  /** Filled primary circle (main action) instead of a plain icon. */
  filled?: boolean;
  /** A bigger filled circle, for the floating add button. */
  large?: boolean;
  disabled?: boolean;
}

export function IconButton({ icon, label, onPress, filled, large, disabled }: IconButtonProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [filled ? styles.filled : styles.plain, large && styles.large, pressed && styles.pressed, disabled && styles.disabled]}>
      <Ionicons
        name={icon}
        size={large ? 30 : filled ? 24 : 22}
        color={filled ? theme.colors.onPrimary : disabled ? theme.colors.textMuted : theme.colors.primary}
      />
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  filled: {
    width: 44,
    height: 44,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    width: 58,
    height: 58,
  },
  plain: {
    padding: t.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
}));
