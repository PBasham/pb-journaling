import { describe, expect, it, jest } from '@jest/globals';

import { createTestDb } from '../../../../test/testDb';
import {
  createBook,
  createCollection,
  createNote,
  listAllBooks,
  updateBook,
  updateNote,
} from '../../library/library';
import { readAllData } from '../database';
import { fromPortableRow } from '../format';
import { docToMarkdown, libraryToMarkdown } from '../markdown';
import type { Book, Collection, Note } from '@/db/schema';

jest.mock('expo-sqlite', () => ({}));
jest.mock('../../../../drizzle/migrations', () => ({ __esModule: true, default: { journal: { entries: [] }, migrations: {} } }));

describe('docToMarkdown', () => {
  it('writes marks, lists and headings', () => {
    const md = docToMarkdown({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Top' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
          ],
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'done' }] }] },
          ],
        },
      ],
    }, 2);
    expect(md).toBe('### Top\n\n**bold** and [link](https://example.com)\n\n- [x] done');
  });
});

describe('libraryToMarkdown', () => {
  it('nests books and pages under collections and hides locked content', async () => {
    const db = createTestDb();
    const col = await createCollection(db, { name: 'Recipes', color: 'slate' });
    const book = await createBook(db, { name: 'Vegan', color: 'slate', collectionId: col });
    await createNote(db, { bookId: book }, { title: 'Soup' });
    const secret = await createNote(db, { collectionId: null }, { title: 'Diary' });
    await updateNote(db, secret, { isLocked: true });
    await updateBook(db, book, { isFavorite: true });

    const data = await readAllData(db);
    const lib = {
      collections: data.collections.map(fromPortableRow) as Collection[],
      books: data.books.map(fromPortableRow) as Book[],
      notes: data.notes.map(fromPortableRow) as Note[],
    };
    const md = libraryToMarkdown(lib, { includeLocked: false });
    expect(md).toContain('## Recipes');
    expect(md).toContain('### 📖 Vegan ★');
    expect(md).toContain('#### 1. Soup');
    expect(md).toContain('## Not in a collection');
    expect(md).toContain('*Locked, not included.*');
    expect(libraryToMarkdown(lib, { includeLocked: true })).not.toContain('Locked, not included');
    expect(await listAllBooks(db)).toHaveLength(1);
  });
});
