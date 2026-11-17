import { useDb } from '@/db';
import type { Tag } from '@/db/schema';
import { useLive } from '@/db/useLive';

import type { ItemKind } from '../library/library';

import { getItemTags, listTagsWithCounts, type TagWithCount } from './tags';

export function useTagsWithCounts() {
  const db = useDb();
  return useLive<TagWithCount[]>(
    () => listTagsWithCounts(db),
    ['tags', 'note_tags', 'book_tags', 'collection_tags', 'notes', 'books', 'collections'],
    [db],
    [],
  );
}

/** A collection's, book's or note's tags (live). */
export function useItemTags(kind: ItemKind, id: string) {
  const db = useDb();
  return useLive<Tag[]>(
    () => getItemTags(db, kind, id),
    ['tags', 'note_tags', 'book_tags', 'collection_tags'],
    [db, kind, id],
    [],
  );
}

export const useNoteTags = (noteId: string) => useItemTags('note', noteId);
