import { describe, expect, it } from '@jest/globals';

import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  constantTimeEqual,
  deriveKey,
  utf8ToBytes,
} from '../crypto';

describe('base64', () => {
  it('round trips every padding length', () => {
    for (const text of ['', 'a', 'ab', 'abc', 'abcd', 'hello journal ✍️']) {
      const bytes = utf8ToBytes(text);
      expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(Array.from(bytes));
    }
  });

  it('matches the standard encoding', () => {
    expect(bytesToBase64(utf8ToBytes('Man'))).toBe('TWFu');
    expect(bytesToBase64(utf8ToBytes('Ma'))).toBe('TWE=');
    expect(bytesToBase64(utf8ToBytes('M'))).toBe('TQ==');
  });
});

describe('deriveKey', () => {
  it('matches a known PBKDF2-SHA256 vector', async () => {
    // RFC 7914 section 11 test vector.
    const key = await deriveKey('passwd', utf8ToBytes('salt'), 1, 64);
    expect(bytesToHex(key).slice(0, 32)).toBe('55ac046e56e3089fec1691c22544b605');
  });
});

describe('constantTimeEqual', () => {
  it('compares bytes', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(false);
  });
});
