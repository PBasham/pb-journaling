import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { createStyles } from '@/theme';

import { Text } from './Text';

interface ScreenProps {
  /** Large title at the top. Omit on screens that sit under a stack header. */
  title?: string;
  /** Small text above the title, such as the date. */
  eyebrow?: string;
  /** Optional element shown to the right of the title, such as an add button. */
  headerRight?: ReactNode;
  children?: ReactNode;
  /** Set to false for screens that manage their own scrolling (lists, editors). */
  scroll?: boolean;
  /** Set to false when a stack header already covers the top safe area. */
  safeTop?: boolean;
}

export function Screen({
  title,
  eyebrow,
  headerRight,
  children,
  scroll = true,
  safeTop = true,
}: ScreenProps) {
  const styles = useStyles();
  const edges: Edge[] = safeTop ? ['top', 'left', 'right'] : ['left', 'right'];

  const header = title ? (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? (
          <Text variant="label" color="textMuted" uppercase>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {headerRight}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, !title && styles.contentNoTitle]}
            keyboardShouldPersistTaps="handled">
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill, !title && styles.contentNoTitle]}>
            {header}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  safeArea: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.xxxl,
    gap: t.spacing.lg,
  },
  contentNoTitle: {
    paddingTop: t.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: t.spacing.xl,
    paddingBottom: t.spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: t.spacing.xs,
  },
}));
