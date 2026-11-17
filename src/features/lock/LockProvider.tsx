import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { run } from '@/lib/errors';

import { authenticateWithBiometrics } from './biometrics';
import {
  clearLockConfig,
  createLockConfig,
  loadAttempts,
  loadLockConfig,
  noAttempts,
  recordFailure,
  saveAttempts,
  saveLockConfig,
  verifySecret,
  type AttemptState,
  type LockConfig,
  type LockMethod,
} from './lockConfig';

export type LockStatus = 'loading' | 'locked' | 'unlocked';

export type SecretCheck =
  | { ok: true }
  | { ok: false; reason: 'wrong'; attempts: AttemptState }
  | { ok: false; reason: 'blocked'; attempts: AttemptState };

type LockOptions = Pick<LockConfig, 'biometrics' | 'relockAfterMs' | 'lockOnOpen'>;

interface LockContextValue {
  /** The whole app. `unlocked` when no lock is set or "lock on open" is off. */
  status: LockStatus;
  /** The PIN or password setup, or null when none is set. Item locks need one. */
  config: LockConfig | null;
  attempts: AttemptState;
  /** True while the app is in the background and a lock is set: hides content in the app switcher. */
  covered: boolean;
  unlock: (secret: string) => Promise<SecretCheck>;
  unlockWithBiometrics: () => Promise<boolean>;
  /** Checks the secret without changing anything (changing or turning off the lock). */
  verify: (secret: string) => Promise<SecretCheck>;
  setLock: (method: LockMethod, secret: string) => Promise<void>;
  updateOptions: (options: Partial<LockOptions>) => Promise<void>;
  removeLock: () => Promise<void>;
  /** Locked items opened this session. They lock again with the app (see `relockAfterMs`). */
  isUnlocked: (ids: string[]) => boolean;
  unlockItems: (ids: string[], secret: string) => Promise<SecretCheck>;
  unlockItemsWithBiometrics: (ids: string[]) => Promise<boolean>;
  /** Locks every opened item again right away. */
  relockItems: () => void;
  /** Counts items as opened without asking (just locked by the person, who is already in). */
  keepOpen: (ids: string[]) => void;
  /**
   * Keeps the app from locking while the person is briefly in another app on purpose
   * (share sheet, file picker). Call the returned function when done.
   */
  suspendAutoLock: () => () => void;
}

const LockContext = createContext<LockContextValue | null>(null);

export function LockProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<LockStatus>('loading');
  const [config, setConfig] = useState<LockConfig | null>(null);
  const [attempts, setAttempts] = useState<AttemptState>(noAttempts);
  const [covered, setCovered] = useState(false);
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());

  const backgroundedAt = useRef<number | null>(null);
  const suspendCount = useRef(0);
  const configRef = useRef<LockConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    run(
      (async () => {
        const [saved, savedAttempts] = await Promise.all([loadLockConfig(), loadAttempts()]);
        if (cancelled) return;
        configRef.current = saved;
        setConfig(saved);
        setAttempts(savedAttempts);
        setStatus(saved?.lockOnOpen ? 'locked' : 'unlocked');
      })(),
      'Could not read the lock settings. Close the app and open it again.',
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const current = configRef.current;
      if (!current || suspendCount.current > 0) return;
      if (next === 'active') {
        const away = backgroundedAt.current;
        backgroundedAt.current = null;
        if (away !== null && Date.now() - away >= current.relockAfterMs) {
          if (current.lockOnOpen) setStatus('locked');
          setOpened(new Set());
        }
        setCovered(false);
      } else {
        backgroundedAt.current ??= Date.now();
        setCovered(true);
      }
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  const check = useCallback(async (secret: string): Promise<SecretCheck> => {
    const current = configRef.current;
    if (!current) return { ok: true };
    const state = await loadAttempts();
    if (state.blockedUntil > Date.now()) {
      setAttempts(state);
      return { ok: false, reason: 'blocked', attempts: state };
    }
    if (await verifySecret(current, secret)) {
      await saveAttempts(noAttempts);
      setAttempts(noAttempts);
      return { ok: true };
    }
    const next = recordFailure(state);
    await saveAttempts(next);
    setAttempts(next);
    return { ok: false, reason: 'wrong', attempts: next };
  }, []);

  const biometricCheck = useCallback(async () => {
    if (!configRef.current?.biometrics) return false;
    suspendCount.current += 1;
    try {
      const ok = await authenticateWithBiometrics();
      if (ok) {
        await saveAttempts(noAttempts);
        setAttempts(noAttempts);
      }
      return ok;
    } finally {
      suspendCount.current -= 1;
    }
  }, []);

  const unlock = useCallback(
    async (secret: string) => {
      const result = await check(secret);
      if (result.ok) setStatus('unlocked');
      return result;
    },
    [check],
  );

  const unlockWithBiometrics = useCallback(async () => {
    const ok = await biometricCheck();
    if (ok) setStatus('unlocked');
    return ok;
  }, [biometricCheck]);

  const addOpened = useCallback((ids: string[]) => {
    setOpened((current) => new Set([...current, ...ids]));
  }, []);

  const unlockItems = useCallback(
    async (ids: string[], secret: string) => {
      const result = await check(secret);
      if (result.ok) addOpened(ids);
      return result;
    },
    [check, addOpened],
  );

  const unlockItemsWithBiometrics = useCallback(
    async (ids: string[]) => {
      const ok = await biometricCheck();
      if (ok) addOpened(ids);
      return ok;
    },
    [biometricCheck, addOpened],
  );

  const isUnlocked = useCallback((ids: string[]) => ids.every((id) => opened.has(id)), [opened]);
  const relockItems = useCallback(() => setOpened(new Set()), []);

  const setLock = useCallback(async (method: LockMethod, secret: string) => {
    const previous = configRef.current;
    const next = await createLockConfig(method, secret, {
      biometrics: previous?.biometrics ?? false,
      relockAfterMs: previous?.relockAfterMs ?? 0,
      lockOnOpen: previous?.lockOnOpen ?? false,
    });
    await saveLockConfig(next);
    await saveAttempts(noAttempts);
    configRef.current = next;
    setAttempts(noAttempts);
    setConfig(next);
    setStatus('unlocked');
  }, []);

  const updateOptions = useCallback<LockContextValue['updateOptions']>(async (options) => {
    const current = configRef.current;
    if (!current) return;
    const next = { ...current, ...options };
    await saveLockConfig(next);
    configRef.current = next;
    setConfig(next);
  }, []);

  const removeLock = useCallback(async () => {
    await clearLockConfig();
    configRef.current = null;
    setAttempts(noAttempts);
    setConfig(null);
    setOpened(new Set());
    setStatus('unlocked');
  }, []);

  const suspendAutoLock = useCallback(() => {
    suspendCount.current += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      suspendCount.current -= 1;
      backgroundedAt.current = null;
      setCovered(false);
    };
  }, []);

  const value = useMemo<LockContextValue>(
    () => ({
      status,
      config,
      attempts,
      covered,
      unlock,
      unlockWithBiometrics,
      verify: check,
      setLock,
      updateOptions,
      removeLock,
      isUnlocked,
      unlockItems,
      unlockItemsWithBiometrics,
      relockItems,
      keepOpen: addOpened,
      suspendAutoLock,
    }),
    [
      status,
      config,
      attempts,
      covered,
      unlock,
      unlockWithBiometrics,
      check,
      setLock,
      updateOptions,
      removeLock,
      isUnlocked,
      unlockItems,
      unlockItemsWithBiometrics,
      relockItems,
      addOpened,
      suspendAutoLock,
    ],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock(): LockContextValue {
  const value = useContext(LockContext);
  if (!value) throw new Error('useLock must be used inside LockProvider');
  return value;
}

/**
 * True while app content must not show: locked, loading, or in the background.
 * Safe outside the provider (returns false). Modals use it, since they draw above the lock screen.
 */
export function useContentHidden(): boolean {
  const value = useContext(LockContext);
  if (!value) return false;
  return value.status !== 'unlocked' || value.covered;
}
