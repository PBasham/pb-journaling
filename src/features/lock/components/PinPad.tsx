import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { createStyles, useTheme } from '@/theme';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  /** Number of dots to show. Defaults to the current length (setup) or `maxLength`. */
  dots?: number;
  /** Shows a biometric button in the bottom left key. */
  biometricIcon?: ComponentProps<typeof Ionicons>['name'];
  onBiometric?: () => void;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinPad({
  value,
  onChange,
  maxLength,
  dots,
  biometricIcon,
  onBiometric,
  disabled,
}: PinPadProps) {
  const styles = useStyles();
  const theme = useTheme();
  const dotCount = dots ?? Math.max(value.length, 4);

  const press = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dots} accessibilityLabel={`${value.length} digits entered`}>
        {Array.from({ length: dotCount }, (_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((digit) => (
          <Key key={digit} label={digit} onPress={() => press(digit)} disabled={disabled} />
        ))}
        {biometricIcon && onBiometric ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use biometrics"
            onPress={onBiometric}
            style={styles.key}>
            <Ionicons name={biometricIcon} size={28} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.key} />
        )}
        <Key label="0" onPress={() => press('0')} disabled={disabled} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete"
          onPress={() => onChange(value.slice(0, -1))}
          disabled={disabled || value.length === 0}
          style={styles.key}>
          <Ionicons name="backspace-outline" size={26} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function Key({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.key, styles.digitKey, pressed && styles.keyPressed]}>
      <Text variant="title">{label}</Text>
    </Pressable>
  );
}

const KEY_SIZE = 72;

const useStyles = createStyles((t) => ({
  container: {
    alignItems: 'center',
    gap: t.spacing.xxl,
  },
  dots: {
    flexDirection: 'row',
    gap: t.spacing.md,
    minHeight: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: t.radius.pill,
    borderWidth: 2,
    borderColor: t.colors.primary,
  },
  dotFilled: {
    backgroundColor: t.colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: KEY_SIZE * 3 + t.spacing.xl * 2,
    gap: t.spacing.xl,
    rowGap: t.spacing.lg,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitKey: {
    backgroundColor: t.colors.surfaceMuted,
  },
  keyPressed: {
    backgroundColor: t.colors.border,
  },
}));
