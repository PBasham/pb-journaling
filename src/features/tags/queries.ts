import { useDb } from '@/db';
import type { Tag } from '@/db/schema';
import { useLive } from '@/db/useLive';

import { getNoteTags, listTagsWithCounts, type TagWithCount } from './tags';

export function useTagsWithCounts() {
  const db = useDb();
  return useLive<TagWithCount[]>(() => listTagsWithCounts(db), ['tags', 'note_tags', 'notes'], [db], []);
}

export function useNoteTags(noteId: string) {
  const db = useDb();
  return useLive<Tag[]>(() => getNoteTags(db, noteId), ['tags', 'note_tags'], [db, noteId], []);
}
