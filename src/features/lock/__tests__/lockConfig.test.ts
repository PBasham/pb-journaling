import { describe, expect, it } from '@jest/globals';

import {
  attemptsLeft,
  createLockConfig,
  noAttempts,
  recordFailure,
  validateSecret,
  verifySecret,
} from '../lockConfig';

const options = { biometrics: false, relockAfterMs: 0, lockOnOpen: true };

describe('validateSecret', () => {
  it('checks PINs', () => {
    expect(validateSecret('pin', '1234')).toBeNull();
    expect(validateSecret('pin', '123')).toMatch(/4 to 8/);
    expect(validateSecret('pin', '123456789')).toMatch(/4 to 8/);
    expect(validateSecret('pin', '12a4')).toMatch(/numbers/);
    expect(validateSecret('pin', '1111')).toMatch(/same digit/);
  });

  it('checks passwords', () => {
    expect(validateSecret('password', 'short')).toMatch(/at least 6/);
    expect(validateSecret('password', 'long enough')).toBeNull();
  });
});

describe('createLockConfig / verifySecret', () => {
  it('never stores the secret and verifies it', async () => {
    const config = await createLockConfig('pin', '2580', options, 10);
    expect(JSON.stringify(config)).not.toContain('2580');
    expect(config.pinLength).toBe(4);
    expect(await verifySecret(config, '2580')).toBe(true);
    expect(await verifySecret(config, '2581')).toBe(false);
  });

  it('salts each config', async () => {
    const a = await createLockConfig('password', 'same secret', options, 10);
    const b = await createLockConfig('password', 'same secret', options, 10);
    expect(a.hash).not.toBe(b.hash);
    expect(a.pinLength).toBeUndefined();
  });

  it('rejects invalid secrets', async () => {
    await expect(createLockConfig('pin', '12', options, 10)).rejects.toThrow();
  });
});

describe('recordFailure', () => {
  it('allows five tries, then waits longer each time up to 15 minutes', () => {
    const now = 1_000_000;
    let state = noAttempts;
    for (let i = 0; i < 4; i++) state = recordFailure(state, now);
    expect(state.blockedUntil).toBe(0);
    expect(attemptsLeft(state)).toBe(1);

    state = recordFailure(state, now);
    expect(state.blockedUntil - now).toBe(30_000);
    state = recordFailure(state, now);
    expect(state.blockedUntil - now).toBe(60_000);

    for (let i = 0; i < 10; i++) state = recordFailure(state, now);
    expect(state.blockedUntil - now).toBe(15 * 60_000);
  });
});
