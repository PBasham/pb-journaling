/** Live data for screens. Each hook re-reads when the tables it depends on change. */
import { useCallback, useEffect, useState } from 'react';

import { useDb } from '@/db';
import type { Book, Collection, Note } from '@/db/schema';
import { useLive } from '@/db/useLive';
import { run } from '@/lib/errors';

import {
  defaultSort,
  getBook,
  getCollection,
  getNote,
  getSetting,
  listAllBooks,
  listBooks,
  listCollections,
  listFavorites,
  listNotes,
  listPages,
  listTrash,
  setSetting,
  type BookWithCounts,
  type CollectionWithCounts,
  type Favorites,
  type SortOrder,
  type TrashItem,
} from './library';

const ALL = ['collections', 'books', 'notes'];

export type SortKey = 'collections' | 'books' | 'notes';

/** A list's sort order, remembered between launches. */
export function useSort(key: SortKey): [SortOrder, (sort: SortOrder) => void] {
  const db = useDb();
  const [sort, setSortState] = useState<SortOrder>(defaultSort);
  useEffect(() => {
    let active = true;
    run(
      getSetting(db, `sort.${key}`, defaultSort).then((saved) => {
        if (active) setSortState(saved);
      }),
    );
    return () => {
      active = false;
    };
  }, [db, key]);
  const setSort = useCallback(
    (next: SortOrder) => {
      setSortState(next);
      run(setSetting(db, `sort.${key}`, next), 'Could not save the sort order.');
    },
    [db, key],
  );
  return [sort, setSort];
}

export function useCollections(sort: SortOrder) {
  const db = useDb();
  return useLive<CollectionWithCounts[]>(() => listCollections(db, sort), ALL, [db, sort.field, sort.ascending], []);
}

export function useCollection(id: string) {
  const db = useDb();
  return useLive<Collection | undefined>(() => getCollection(db, id), ['collections'], [db, id], undefined);
}

export function useBooks(collectionId: string | null, sort: SortOrder) {
  const db = useDb();
  return useLive<BookWithCounts[]>(
    () => listBooks(db, collectionId, sort),
    ['books', 'notes'],
    [db, collectionId, sort.field, sort.ascending],
    [],
  );
}

export function useBook(id: string) {
  const db = useDb();
  return useLive<Book | undefined>(() => getBook(db, id), ['books'], [db, id], undefined);
}

export function useNotes(collectionId: string | null, sort: SortOrder) {
  const db = useDb();
  return useLive<Note[]>(() => listNotes(db, collectionId, sort), ['notes'], [db, collectionId, sort.field, sort.ascending], []);
}

export function usePages(bookId: string) {
  const db = useDb();
  return useLive<Note[]>(() => listPages(db, bookId), ['notes'], [db, bookId], []);
}

export function useNote(id: string) {
  const db = useDb();
  return useLive<Note | undefined>(() => getNote(db, id), ['notes'], [db, id], undefined);
}

export function useFavorites() {
  const db = useDb();
  return useLive<Favorites>(() => listFavorites(db), ALL, [db], { collections: [], books: [], notes: [] });
}

/** Everywhere something can be moved to. */
export function useDestinations() {
  const db = useDb();
  return useLive<{ collections: Collection[]; books: Book[] }>(
    async () => ({
      collections: await listCollections(db, { field: 'name', ascending: true }),
      books: await listAllBooks(db),
    }),
    ['collections', 'books'],
    [db],
    { collections: [], books: [] },
  );
}

/** What's in Recently deleted (live). */
export function useTrash() {
  const db = useDb();
  return useLive<TrashItem[]>(() => listTrash(db), ALL, [db], []);
}
