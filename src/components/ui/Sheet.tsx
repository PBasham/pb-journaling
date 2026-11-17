import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles, useTheme } from '@/theme';

import { ErrorToast } from './ErrorToast';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** A panel that slides up from the bottom over a dimmed background. Tap outside to close. */
export function Sheet({ visible, onClose, children }: SheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      // Draw under the system bars so the keyboard offset below is measured from the true screen edge.
      statusBarTranslucent
      navigationBarTranslucent>
      {/* Modals get their own window, so the app's keyboard handling doesn't reach them.
          Padding lifts the sheet above the keyboard on both platforms. */}
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>{children}</View>
      </KeyboardAvoidingView>
      {/* The sheet has its own window, so errors from inside it need their own place to show. */}
      <ErrorToast />
    </Modal>
  );
}

const useStyles = createStyles((t) => ({
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
    justifyContent: 'flex-end',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: '100%',
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.lg,
    borderTopRightRadius: t.radius.lg,
    padding: t.spacing.lg,
    gap: t.spacing.lg,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
}));
