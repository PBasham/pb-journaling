import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { createStyles, useTheme } from '@/theme';
import { run } from '@/lib/errors';

import { getBiometricSupport } from './biometrics';
import { attemptsLeft } from './lockConfig';
import { SecretEntry } from './components/SecretEntry';
import { useLock } from './LockProvider';

/**
 * Renders the app, and covers it with the lock screen when locked, or with a blank cover while the app
 * is in the background so notes do not show in the app switcher.
 */
export function LockGate({ children }: PropsWithChildren) {
  const { status, covered } = useLock();
  const hidden = status !== 'unlocked' || covered;

  return (
    <View style={StyleSheet.absoluteFill}>
      {status !== 'loading' ? (
        // Stays mounted while locked so unsaved work survives, but is hidden from screen readers.
        <View
          style={StyleSheet.absoluteFill}
          aria-hidden={hidden}
          importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}>
          {children}
        </View>
      ) : null}
      {status === 'locked' ? <LockScreen /> : covered || status === 'loading' ? <PrivacyCover /> : null}
    </View>
  );
}

function LockScreen() {
  const styles = useStyles();
  const { config, attempts, unlock, unlockWithBiometrics } = useLock();
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const prompted = useRef(false);

  useEffect(() => {
    if (!config?.biometrics) return;
    run(getBiometricSupport().then((support) => {
      if (!support.available) return;
      setBiometricLabel(support.label);
      if (!prompted.current) {
        prompted.current = true;
        run(unlockWithBiometrics());
      }
    }));
  }, [config?.biometrics, unlockWithBiometrics]);

  if (!config) return null;
  const isPin = config.method === 'pin';
  const biometricIcon = biometricLabel?.startsWith('Face') ? 'scan-outline' : 'finger-print';

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.brand}>
        <View style={styles.badge}>
          <LockIcon />
        </View>
        <Text variant="heading">PB Notes</Text>
      </View>
      <SecretEntry
        method={config.method}
        title={isPin ? 'Enter your PIN' : 'Enter your password'}
        autoSubmitLength={isPin ? config.pinLength : undefined}
        blockedUntil={attempts.blockedUntil}
        submitLabel="Unlock"
        biometricIcon={biometricLabel ? biometricIcon : undefined}
        onBiometric={biometricLabel ? () => run(unlockWithBiometrics()) : undefined}
        onSubmit={async (secret) => {
          const result = await unlock(secret);
          if (result.ok) return null;
          if (result.reason === 'blocked') return 'Too many attempts.';
          const left = attemptsLeft(result.attempts);
          return left > 0
            ? `Wrong ${isPin ? 'PIN' : 'password'}. ${left} ${left === 1 ? 'try' : 'tries'} left before a short wait.`
            : `Wrong ${isPin ? 'PIN' : 'password'}.`;
        }}
      />
    </SafeAreaView>
  );
}

function PrivacyCover() {
  const styles = useStyles();
  return (
    <View style={[styles.overlay, styles.cover]}>
      <View style={styles.badge}>
        <LockIcon />
      </View>
    </View>
  );
}

function LockIcon() {
  const theme = useTheme();
  return <Ionicons name="lock-closed" size={28} color={theme.colors.primary} />;
}

const useStyles = createStyles((t) => ({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: t.colors.background,
    justifyContent: 'center',
    paddingHorizontal: t.spacing.xl,
    gap: t.spacing.xxl,
  },
  cover: {
    alignItems: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
