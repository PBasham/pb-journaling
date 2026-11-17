import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Screen } from '@/components/ui';
import { useDb } from '@/db';
import { clearAllLocks } from '@/features/library/library';
import { SecretEntry, useLock, validateSecret, type LockMethod } from '@/features/lock';

type Mode = 'new' | 'change' | 'disable';
type Step = 'current' | 'enter' | 'confirm';

const noun = (method: LockMethod) => (method === 'pin' ? 'PIN' : 'password');

/**
 * One flow for setting, changing and removing the PIN or password:
 * - new: choose, confirm
 * - change: current, choose, confirm (can also switch between PIN and password)
 * - disable: current
 */
export default function LockSetupScreen() {
  const params = useLocalSearchParams<{ mode?: Mode; method?: LockMethod }>();
  const mode: Mode = params.mode ?? 'new';
  const db = useDb();
  const { config, verify, setLock, removeLock, attempts } = useLock();
  const target: LockMethod = params.method ?? config?.method ?? 'pin';

  const [step, setStep] = useState<Step>(mode === 'new' || !config ? 'enter' : 'current');
  const [first, setFirst] = useState('');
  const [mismatch, setMismatch] = useState(false);

  const headerTitle =
    mode === 'disable' ? 'Remove lock' : mode === 'change' ? `New ${noun(target)}` : `Set ${noun(target)}`;

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: headerTitle }} />

      {step === 'current' && config ? (
        <SecretEntry
          key="current"
          method={config.method}
          title={`Enter your current ${noun(config.method)}`}
          blockedUntil={attempts.blockedUntil}
          onSubmit={async (secret) => {
            const result = await verify(secret);
            if (!result.ok) {
              return result.reason === 'blocked' ? 'Too many attempts.' : `Wrong ${noun(config.method)}.`;
            }
            if (mode === 'disable') {
              // Nothing can stay locked without a PIN or password to open it.
              await clearAllLocks(db);
              await removeLock();
              router.back();
              return null;
            }
            setStep('enter');
            return null;
          }}
        />
      ) : null}

      {step === 'enter' ? (
        <SecretEntry
          key="enter"
          method={target}
          title={`Choose a ${noun(target)}`}
          subtitle={
            mismatch
              ? `Those didn't match. Choose your ${noun(target)} again.`
              : target === 'pin'
                ? '4 to 8 digits'
                : 'At least 6 characters'
          }
          onSubmit={async (secret) => {
            const error = validateSecret(target, secret);
            if (error) return error;
            setMismatch(false);
            setFirst(secret);
            setStep('confirm');
            return null;
          }}
        />
      ) : null}

      {step === 'confirm' ? (
        <SecretEntry
          key="confirm"
          method={target}
          title={`Confirm your ${noun(target)}`}
          submitLabel="Save"
          autoSubmitLength={target === 'pin' ? first.length : undefined}
          onSubmit={async (secret) => {
            if (secret !== first) {
              setFirst('');
              setMismatch(true);
              setStep('enter');
              return null;
            }
            await setLock(target, secret);
            router.back();
            return null;
          }}
        />
      ) : null}
    </Screen>
  );
}
