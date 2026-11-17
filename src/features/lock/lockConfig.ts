import { bytesToHex, constantTimeEqual, deriveKey, hexToBytes, randomBytes } from '@/lib/crypto';

import { secureStorage } from './secureStorage';

export type LockMethod = 'pin' | 'password';

/** How long the app can be in the background before it (and unlocked items) lock again. */
export const relockOptions = [
  { value: 0, label: 'Immediately' },
  { value: 60_000, label: 'After 1 minute' },
  { value: 5 * 60_000, label: 'After 5 minutes' },
  { value: 15 * 60_000, label: 'After 15 minutes' },
] as const;

export interface LockConfig {
  version: 1;
  method: LockMethod;
  /** Hex salt and PBKDF2-SHA256 hash of the PIN or password. The secret itself is never stored. */
  salt: string;
  hash: string;
  iterations: number;
  /** PIN length, so the unlock pad can submit on the last digit. Unset for passwords. */
  pinLength?: number;
  biometrics: boolean;
  relockAfterMs: number;
  /**
   * Ask for the PIN or password whenever the app opens. When off, the secret only guards locked
   * collections, books and notes.
   */
  lockOnOpen: boolean;
}

export interface AttemptState {
  failures: number;
  /** Epoch ms until which unlocking is blocked. */
  blockedUntil: number;
}

const CONFIG_KEY = 'lock.config';
const ATTEMPTS_KEY = 'lock.attempts';

/** Tuned so hashing takes a noticeable but short moment on a phone. Stored per config, so it can change. */
export const DEFAULT_ITERATIONS = 20_000;

export const PIN_MIN = 4;
export const PIN_MAX = 8;
export const PASSWORD_MIN = 6;

/** Returns an error message, or null when the secret is acceptable. */
export function validateSecret(method: LockMethod, secret: string): string | null {
  if (method === 'pin') {
    if (!/^\d+$/.test(secret)) return 'PIN can only contain numbers.';
    if (secret.length < PIN_MIN || secret.length > PIN_MAX) {
      return `PIN must be ${PIN_MIN} to ${PIN_MAX} digits.`;
    }
    if (/^(\d)\1+$/.test(secret)) return 'Pick a PIN that is not all the same digit.';
    return null;
  }
  if (secret.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  return null;
}

export async function createLockConfig(
  method: LockMethod,
  secret: string,
  options: { biometrics: boolean; relockAfterMs: number; lockOnOpen: boolean },
  iterations = DEFAULT_ITERATIONS,
): Promise<LockConfig> {
  const error = validateSecret(method, secret);
  if (error) throw new Error(error);
  const salt = randomBytes(16);
  const hash = await deriveKey(secret, salt, iterations);
  return {
    version: 1,
    method,
    salt: bytesToHex(salt),
    hash: bytesToHex(hash),
    iterations,
    pinLength: method === 'pin' ? secret.length : undefined,
    biometrics: options.biometrics,
    relockAfterMs: options.relockAfterMs,
    lockOnOpen: options.lockOnOpen,
  };
}

export async function verifySecret(config: LockConfig, secret: string): Promise<boolean> {
  const hash = await deriveKey(secret, hexToBytes(config.salt), config.iterations);
  return constantTimeEqual(hash, hexToBytes(config.hash));
}

// Attempt limiting ---------------------------------------------------------

export const FREE_ATTEMPTS = 5;
const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 15 * 60_000;

/** After 5 free attempts, each failure blocks unlocking for 30s, doubling up to 15 minutes. */
export function recordFailure(state: AttemptState, now = Date.now()): AttemptState {
  const failures = state.failures + 1;
  if (failures < FREE_ATTEMPTS) return { failures, blockedUntil: 0 };
  const delay = Math.min(BASE_DELAY_MS * 2 ** (failures - FREE_ATTEMPTS), MAX_DELAY_MS);
  return { failures, blockedUntil: now + delay };
}

/** Wrong tries left before a wait kicks in. */
export function attemptsLeft(state: AttemptState): number {
  return Math.max(0, FREE_ATTEMPTS - state.failures);
}

export const noAttempts: AttemptState = { failures: 0, blockedUntil: 0 };

// Storage -----------------------------------------------------------------

export async function loadLockConfig(): Promise<LockConfig | null> {
  const raw = await secureStorage.get(CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LockConfig;
    return parsed.version === 1 ? { ...parsed, lockOnOpen: parsed.lockOnOpen ?? true } : null;
  } catch {
    return null;
  }
}

export const saveLockConfig = (config: LockConfig) =>
  secureStorage.set(CONFIG_KEY, JSON.stringify(config));

export async function clearLockConfig() {
  await secureStorage.remove(CONFIG_KEY);
  await secureStorage.remove(ATTEMPTS_KEY);
}

export async function loadAttempts(): Promise<AttemptState> {
  const raw = await secureStorage.get(ATTEMPTS_KEY);
  if (!raw) return noAttempts;
  try {
    return JSON.parse(raw) as AttemptState;
  } catch {
    return noAttempts;
  }
}

export const saveAttempts = (state: AttemptState) =>
  secureStorage.set(ATTEMPTS_KEY, JSON.stringify(state));
