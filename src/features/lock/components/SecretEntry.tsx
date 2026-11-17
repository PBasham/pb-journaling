import type Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ComponentProps } from 'react';
import { View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { createStyles } from '@/theme';
import { run } from '@/lib/errors';

import { PIN_MAX, type LockMethod } from '../lockConfig';

import { PinPad } from './PinPad';

interface SecretEntryProps {
  method: LockMethod;
  title: string;
  subtitle?: string;
  /** Returns an error message to show, or null on success. */
  onSubmit: (secret: string) => Promise<string | null>;
  /** Submit automatically once a PIN reaches this length (unlocking). Otherwise a button submits. */
  autoSubmitLength?: number;
  /** Epoch ms until which entry is blocked after too many attempts. */
  blockedUntil?: number;
  biometricIcon?: ComponentProps<typeof Ionicons>['name'];
  onBiometric?: () => void;
  submitLabel?: string;
}

/** PIN pad or password field, used by the lock screen and the lock setup flow. */
export function SecretEntry({
  method,
  title,
  subtitle,
  onSubmit,
  autoSubmitLength,
  blockedUntil = 0,
  biometricIcon,
  onBiometric,
  submitLabel = 'Continue',
}: SecretEntryProps) {
  const styles = useStyles();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const remaining = useCountdown(blockedUntil);
  const blocked = remaining > 0;

  const submit = async (secret: string) => {
    if (busy || blocked || !secret) return;
    setBusy(true);
    const message = await onSubmit(secret);
    setBusy(false);
    if (message) {
      setError(message);
      setValue('');
    }
  };

  const changePin = (next: string) => {
    setError(null);
    setValue(next);
    if (autoSubmitLength && next.length === autoSubmitLength) run(submit(next));
  };

  const status = blocked
    ? `Too many attempts. Try again in ${formatSeconds(remaining)}.`
    : (error ?? subtitle ?? ' ');

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text variant="title" align="center">
          {title}
        </Text>
        <Text
          align="center"
          color={blocked || error ? 'danger' : 'textMuted'}
          accessibilityLiveRegion="polite">
          {status}
        </Text>
      </View>

      {method === 'pin' ? (
        <View style={styles.pinArea}>
          <PinPad
            value={value}
            onChange={changePin}
            maxLength={autoSubmitLength ?? PIN_MAX}
            dots={autoSubmitLength}
            biometricIcon={biometricIcon}
            onBiometric={onBiometric}
            disabled={busy || blocked}
          />
          {!autoSubmitLength ? (
            <Button
              title={submitLabel}
              onPress={() => run(submit(value))}
              disabled={value.length === 0 || blocked}
              loading={busy}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.passwordArea}>
          <TextField
            value={value}
            onChangeText={(text) => {
              setError(null);
              setValue(text);
            }}
            placeholder="Password"
            secureTextEntry
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => run(submit(value))}
            editable={!blocked}
          />
          <Button
            title={submitLabel}
            onPress={() => run(submit(value))}
            disabled={value.length === 0 || blocked}
            loading={busy}
          />
          {biometricIcon && onBiometric ? (
            <Button title="Use biometrics" variant="ghost" icon={biometricIcon} onPress={onBiometric} />
          ) : null}
        </View>
      )}
    </View>
  );
}

function useCountdown(until: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const useStyles = createStyles((t) => ({
  container: {
    gap: t.spacing.xxl,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  heading: {
    gap: t.spacing.sm,
  },
  pinArea: {
    gap: t.spacing.xl,
  },
  passwordArea: {
    gap: t.spacing.md,
  },
}));
