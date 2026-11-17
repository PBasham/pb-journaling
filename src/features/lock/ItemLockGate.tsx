import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useDb } from '@/db';
import { useLive } from '@/db/useLive';
import { lockChain, type ItemKind } from '@/features/library/library';
import { run } from '@/lib/errors';
import { createStyles, useTheme } from '@/theme';

import { getBiometricSupport } from './biometrics';
import { SecretEntry } from './components/SecretEntry';
import { attemptsLeft } from './lockConfig';
import { useLock } from './LockProvider';

interface ItemLockGateProps extends PropsWithChildren {
  kind: ItemKind;
  id: string;
  /** "Recipes", shown on the lock screen. */
  name?: string;
}

/**
 * Shows its children only once the item, and anything locked that holds it, has been unlocked
 * this session. Otherwise asks for the PIN or password (or biometrics).
 */
export function ItemLockGate({ kind, id, name, children }: ItemLockGateProps) {
  const db = useDb();
  const { config, isUnlocked } = useLock();
  const { data: chain, loaded } = useLive(() => lockChain(db, kind, id), ['collections', 'books', 'notes'], [db, kind, id], []);
  if (!loaded) return null;
  // With no PIN or password set, nothing can be locked (turning the lock off clears item locks).
  if (!config || !chain.length || isUnlocked(chain)) return <>{children}</>;
  return <ItemUnlock chain={chain} name={name} />;
}

function ItemUnlock({ chain, name }: { chain: string[]; name?: string }) {
  const styles = useStyles();
  const theme = useTheme();
  const { config, attempts, unlockItems, unlockItemsWithBiometrics } = useLock();
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const prompted = useRef(false);

  useEffect(() => {
    if (!config?.biometrics) return;
    run(
      getBiometricSupport().then((support) => {
        if (!support.available) return;
        setBiometricLabel(support.label);
        if (!prompted.current) {
          prompted.current = true;
          run(unlockItemsWithBiometrics(chain));
        }
      }),
    );
  }, [config?.biometrics, unlockItemsWithBiometrics, chain]);

  if (!config) return null;
  const isPin = config.method === 'pin';
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Ionicons name="lock-closed" size={26} color={theme.colors.primary} />
      </View>
      <SecretEntry
        method={config.method}
        title={name ? `“${name}” is locked` : 'This is locked'}
        subtitle={`Enter your ${isPin ? 'PIN' : 'password'} to open it.`}
        autoSubmitLength={isPin ? config.pinLength : undefined}
        blockedUntil={attempts.blockedUntil}
        submitLabel="Unlock"
        biometricIcon={biometricLabel ? (biometricLabel.startsWith('Face') ? 'scan-outline' : 'finger-print') : undefined}
        onBiometric={biometricLabel ? () => run(unlockItemsWithBiometrics(chain)) : undefined}
        onSubmit={async (secret) => {
          const result = await unlockItems(chain, secret);
          if (result.ok) return null;
          if (result.reason === 'blocked') return 'Too many attempts.';
          const left = attemptsLeft(result.attempts);
          return left > 0
            ? `Wrong ${isPin ? 'PIN' : 'password'}. ${left} ${left === 1 ? 'try' : 'tries'} left before a short wait.`
            : `Wrong ${isPin ? 'PIN' : 'password'}.`;
        }}
      />
      <Text variant="caption" color="textMuted" align="center">
        Locked items open until the app locks again.
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: t.spacing.xl,
    gap: t.spacing.xl,
    backgroundColor: t.colors.background,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
