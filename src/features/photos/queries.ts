import { useDb } from '@/db';
import type { NotePhoto } from '@/db/schema';
import { useLive } from '@/db/useLive';

import { listNotePhotos } from './photos';

export function useNotePhotos(noteId: string) {
  const db = useDb();
  return useLive<NotePhoto[]>(() => listNotePhotos(db, noteId), ['note_photos'], [db, noteId], []);
}
