import { View } from 'react-native';

import { createStyles } from '@/theme';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  /** Styles the confirm button as destructive. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A yes/no question. Used instead of the system alert so it matches the app and works everywhere. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const styles = useStyles();
  return (
    <Sheet visible={visible} onClose={onCancel}>
      <View style={styles.text}>
        <Text variant="heading">{title}</Text>
        {message ? <Text color="textMuted">{message}</Text> : null}
      </View>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button title="Cancel" variant="secondary" onPress={onCancel} />
        </View>
        <View style={styles.action}>
          <Button
            title={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
          />
        </View>
      </View>
    </Sheet>
  );
}

const useStyles = createStyles((t) => ({
  text: {
    gap: t.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  action: {
    flex: 1,
  },
}));
