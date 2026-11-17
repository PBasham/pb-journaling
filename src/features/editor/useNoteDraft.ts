import { useCallback, useEffect, useRef } from 'react';

import { useDb } from '@/db';
import type { Note } from '@/db/schema';
import { reportError, run } from '@/lib/errors';

import { discardNote, updateNote } from '../library/library';

import { isDocEmpty, parseDoc, type Doc } from './document';

const AUTOSAVE_MS = 700;

/**
 * Removals of blank new notes, waiting a moment. In development React may unmount and remount a
 * screen straight away; the remount cancels the removal so the note it is showing survives.
 */
const pendingRemovals = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Saves a note's title and document as the person types.
 * - Saves run one at a time, so fast typing never writes out of order.
 * - Leaving the screen saves right away.
 * - A note made just now and left blank is removed on the way out, so tapping + by mistake
 *   doesn't leave empty notes behind.
 */
export function useNoteDraft(note: Note, isNew: boolean) {
  const db = useDb();
  const pending = useRef<{ title?: string; doc?: Doc }>({});
  const latest = useRef({ title: note.title, doc: parseDoc(note.contentJson) });
  const queue = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removed = useRef(false);

  const save = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    queue.current = queue.current
      .then(async () => {
        const patch = pending.current;
        pending.current = {};
        if (removed.current || (patch.title === undefined && patch.doc === undefined)) return;
        await updateNote(db, note.id, patch);
      })
      .catch((error: unknown) => reportError(error, 'Could not save your note. Keep this screen open and try again.'));
    return queue.current;
  }, [db, note.id]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(save()), AUTOSAVE_MS);
  }, [save]);

  const setTitle = useCallback(
    (title: string) => {
      latest.current.title = title;
      pending.current.title = title;
      schedule();
    },
    [schedule],
  );

  const setDoc = useCallback(
    (doc: Doc) => {
      if (JSON.stringify(doc) === JSON.stringify(latest.current.doc)) return;
      latest.current.doc = doc;
      pending.current.doc = doc;
      schedule();
    },
    [schedule],
  );

  /** Stops saving, for when the note is deleted from this screen. */
  const stop = useCallback(() => {
    removed.current = true;
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const waiting = pendingRemovals.get(note.id);
    if (waiting) {
      clearTimeout(waiting);
      pendingRemovals.delete(note.id);
      removed.current = false;
    }
  }, [note.id]);

  useEffect(
    () => () => {
      if (removed.current) return;
      const blank = !latest.current.title.trim() && isDocEmpty(latest.current.doc);
      if (isNew && blank) {
        removed.current = true;
        if (timer.current) clearTimeout(timer.current);
        const id = note.id;
        pendingRemovals.set(
          id,
          setTimeout(() => {
            pendingRemovals.delete(id);
            run(
              queue.current.then(() => discardNote(db, id)),
              'Could not remove the empty note.',
            );
          }, 0),
        );
        return;
      }
      run(save());
    },
    [db, isNew, note.id, save],
  );

  return { setTitle, setDoc, flush: save, stop };
}
