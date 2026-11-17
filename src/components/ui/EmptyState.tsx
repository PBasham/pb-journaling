import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { createStyles, useTheme } from '@/theme';

import { Text } from './Text';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={theme.colors.primary} />
      </View>
      <Text variant="bodyStrong" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="caption" color="textMuted" align="center">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  container: {
    alignItems: 'center',
    paddingVertical: t.spacing.xl,
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing.xs,
  },
}));
