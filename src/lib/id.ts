import { randomUUID } from 'expo-crypto';

/** New unique ID for a user created record. */
export function newId(): string {
  return randomUUID();
}
