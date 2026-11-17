import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { createStyles, useTheme } from '@/theme';

import { Text } from './Text';

interface ListRowProps {
  title: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Secondary text under the title. */
  description?: string;
  /** Short value shown on the right, such as the current setting. */
  value?: string;
  /** Custom element on the right (a switch, a checkmark). Replaces `value` and the chevron. */
  right?: ReactNode;
  onPress?: () => void;
  /** Draws a divider above the row. Set on every row except the first in a group. */
  divider?: boolean;
  destructive?: boolean;
}

export function ListRow({
  title,
  icon,
  description,
  value,
  right,
  onPress,
  divider,
  destructive,
}: ListRowProps) {
  const styles = useStyles();
  const theme = useTheme();

  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? theme.colors.danger : theme.colors.textMuted}
        />
      ) : null}
      <View style={styles.text}>
        <Text color={destructive ? 'danger' : 'text'}>{title}</Text>
        {description ? (
          <Text variant="caption" color="textMuted">
            {description}
          </Text>
        ) : null}
      </View>
      {right ?? (
        <>
          {value ? <Text color="textMuted">{value}</Text> : null}
          {onPress ? (
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          ) : null}
        </>
      )}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, divider && styles.divider]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, value, description].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

/** Groups rows inside a card. */
export function ListGroup({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.group}>{children}</View>;
}

const useStyles = createStyles((t) => ({
  group: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: t.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.md,
    minHeight: 52,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    gap: t.spacing.xxs,
  },
}));
