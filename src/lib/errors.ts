/**
 * Short messages at the top of the screen.
 *
 * Nothing fails silently: `run(promise, 'Could not delete the note.')` replaces a bare
 * `void promise` in event handlers. A failure shows in the `ErrorToast`, and the error goes to the
 * console for debugging. The same bar also offers Undo after something is deleted (`showUndo`).
 */
import { useSyncExternalStore } from 'react';

export interface ShownError {
  id: number;
  message: string;
  /** 'error' for failures, 'info' for confirmations like "Note deleted". */
  kind: 'error' | 'info';
  /** A button on the message, like Undo. */
  action?: { label: string; onPress: () => void };
}

const FALLBACK = 'Something went wrong. Please try again.';

let current: ShownError | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Shows a message to the user. A repeat of the message on screen restarts its timer. */
export function showError(message: string = FALLBACK): void {
  current = { id: nextId++, message, kind: 'error' };
  emit();
}

/** A short confirmation, like "Moved." */
export function showInfo(message: string): void {
  current = { id: nextId++, message, kind: 'info' };
  emit();
}

/**
 * "Note deleted" with an Undo button for a few seconds. `restore` puts it back; a failure to
 * restore is shown like any other.
 */
export function showUndo(message: string, restore: () => Promise<unknown>): void {
  const id = nextId++;
  current = {
    id,
    message,
    kind: 'info',
    action: {
      label: 'Undo',
      onPress: () => {
        dismissError(id);
        run(restore(), 'Could not undo. It may already be gone for good.');
      },
    },
  };
  emit();
}

export function dismissError(id: number): void {
  if (current?.id !== id) return;
  current = null;
  emit();
}

/** Logs the error and tells the user. Use where a promise would otherwise be dropped. */
export function reportError(error: unknown, message: string = FALLBACK): void {
  console.error(message, error);
  showError(message);
}

/** Runs a promise from an event handler: never left unhandled, and a failure is shown. */
export function run(promise: Promise<unknown>, message: string = FALLBACK): void {
  promise.catch((error: unknown) => reportError(error, message));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const peekError = () => current;
export const peekTopHost = () => hostIds[hostIds.length - 1];

export function useShownError(): ShownError | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}

/*
 * Several toast hosts can be mounted (the app, and any open sheet, which draws in its own window).
 * Only the newest shows the message, so it is never hidden behind a sheet or shown twice.
 */
let hostIds: number[] = [];
let nextHost = 1;
const hostListeners = new Set<() => void>();

export function newHostId(): number {
  return nextHost++;
}

export function addHost(id: number): void {
  hostIds = [...hostIds.filter((h) => h !== id), id];
  for (const l of hostListeners) l();
}

export function removeHost(id: number): void {
  hostIds = hostIds.filter((h) => h !== id);
  for (const l of hostListeners) l();
}

export function useTopHost(): number | undefined {
  return useSyncExternalStore(
    (l) => {
      hostListeners.add(l);
      return () => {
        hostListeners.delete(l);
      };
    },
    () => hostIds[hostIds.length - 1],
    () => hostIds[hostIds.length - 1],
  );
}

/** Test helper. */
export function resetErrors(): void {
  current = null;
  hostIds = [];
  emit();
}
