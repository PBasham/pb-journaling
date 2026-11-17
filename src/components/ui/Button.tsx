import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { createStyles, useTheme, type ThemeColors } from '@/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
}

const textColor: Record<Variant, keyof ThemeColors> = {
  primary: 'onPrimary',
  secondary: 'text',
  danger: 'danger',
  ghost: 'primary',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
}: ButtonProps) {
  const styles = useStyles();
  const theme = useTheme();
  const inactive = disabled || loading;
  const color = theme.colors[textColor[variant]];

  return (
    <Pressable
      accessibilityRole="button"
      // The title alone: otherwise the icon's glyph becomes part of the name screen readers read.
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        inactive && styles.disabled,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={color} />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={color} />
        ) : null}
        <Text variant="bodyStrong" color={textColor[variant]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  base: {
    minHeight: 48,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing.lg,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
  },
  primary: {
    backgroundColor: t.colors.primary,
  },
  secondary: {
    backgroundColor: t.colors.surfaceMuted,
  },
  danger: {
    backgroundColor: t.colors.surfaceMuted,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
}));
