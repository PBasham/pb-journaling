import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addHost, dismissError, newHostId, removeHost, useShownError, useTopHost } from '@/lib/errors';
import { createStyles, useTheme } from '@/theme';

import { IconButton } from './IconButton';
import { Text } from './Text';

const SHOW_MS = 6000;

/**
 * Shows the latest message (an error, or "Deleted" with Undo) at the top of the screen for a few seconds. Mounted once for the
 * app and inside each sheet; only the newest one draws (see `lib/errors`).
 */
export function ErrorToast() {
  const styles = useStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const error = useShownError();
  const top = useTopHost();
  const [host] = useState(newHostId);

  useEffect(() => {
    addHost(host);
    return () => removeHost(host);
  }, [host]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => dismissError(error.id), SHOW_MS);
    return () => clearTimeout(timer);
  }, [error]);

  if (!error || host !== top) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + theme.spacing.sm }]}>
      <View
        style={[styles.toast, error.kind === 'info' && styles.info]}
        accessibilityRole="alert"
        accessibilityLiveRegion={error.kind === 'error' ? 'assertive' : 'polite'}>
        <Ionicons
          name={error.kind === 'error' ? 'alert-circle' : 'checkmark-circle'}
          size={20}
          color={error.kind === 'error' ? theme.colors.danger : theme.colors.primary}
        />
        <Text style={styles.flex}>{error.message}</Text>
        {error.action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={error.action.label}
            onPress={error.action.onPress}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text variant="bodyStrong" color="primary">
              {error.action.label}
            </Text>
          </Pressable>
        ) : null}
        <IconButton icon="close" label="Dismiss" onPress={() => dismissError(error.id)} />
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { position: 'absolute', left: t.spacing.lg, right: t.spacing.lg, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    width: '100%',
    maxWidth: 560,
    paddingVertical: t.spacing.sm,
    paddingLeft: t.spacing.md,
    paddingRight: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.danger,
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: t.spacing.md,
    shadowOffset: { width: 0, height: t.spacing.xs },
    elevation: 6,
  },
  info: { borderColor: t.colors.border },
  action: { paddingHorizontal: t.spacing.sm, paddingVertical: t.spacing.xs },
  pressed: { opacity: 0.7 },
  flex: { flex: 1 },
}));
