import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

import { createStyles, useTheme } from '@/theme';

import { Text } from './Text';

interface CardProps extends ViewProps {
  title?: string;
  /** Small text shown to the right of the title. Stays visible when collapsed, as a summary. */
  meta?: string;
  children?: ReactNode;
  /** With `onToggleCollapsed`, the title row folds the card down to just its title and meta. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function Card({ title, meta, children, style, collapsed = false, onToggleCollapsed, ...rest }: CardProps) {
  const styles = useStyles();
  const theme = useTheme();
  const head = title ? (
    <>
      <Text variant="heading" style={styles.flex}>
        {title}
      </Text>
      {meta ? (
        <Text variant="caption" color="textMuted">
          {meta}
        </Text>
      ) : null}
      {onToggleCollapsed ? (
        <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} color={theme.colors.textMuted} />
      ) : null}
    </>
  ) : null;

  return (
    <View style={[styles.card, style]} {...rest}>
      {head && onToggleCollapsed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}${meta ? `, ${meta}` : ''}`}
          accessibilityState={{ expanded: !collapsed }}
          accessibilityHint={collapsed ? 'Shows this card' : 'Folds this card away'}
          onPress={onToggleCollapsed}
          hitSlop={8}
          style={styles.titleRow}>
          {head}
        </Pressable>
      ) : head ? (
        <View style={styles.titleRow}>{head}</View>
      ) : null}
      {collapsed ? null : children}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.lg,
    gap: t.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  flex: { flex: 1 },
}));
