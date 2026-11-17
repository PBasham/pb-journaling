/**
 * Web fallback for development screenshots only. Web is not a supported platform:
 * localStorage is NOT secure storage.
 */
export const secureStorage = {
  get: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  set: async (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
  remove: async (key: string) => globalThis.localStorage?.removeItem(key),
};
