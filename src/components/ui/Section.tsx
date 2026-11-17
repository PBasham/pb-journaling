import type { ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles } from '@/theme';

import { Text } from './Text';

interface SectionProps {
  title?: string;
  /** Explanation shown under the content. */
  footer?: string;
  children: ReactNode;
}

/** A titled group of content, like a settings section. */
export function Section({ title, footer, children }: SectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      {title ? (
        <Text variant="label" color="textMuted" uppercase style={styles.title}>
          {title}
        </Text>
      ) : null}
      {children}
      {footer ? (
        <Text variant="caption" color="textMuted" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  section: {
    gap: t.spacing.sm,
  },
  title: {
    paddingHorizontal: t.spacing.xs,
  },
  footer: {
    paddingHorizontal: t.spacing.xs,
  },
}));
