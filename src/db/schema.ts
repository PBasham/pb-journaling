/**
 * Database schema. After changing this file, run `npm run db:generate` to create a migration.
 *
 * The library:
 * - A collection holds books and loose notes.
 * - A book holds pages. Pages are rows in `notes` with a `book_id`; their order is `position`.
 * - Books and notes can also sit at the top level, outside any collection.
 * - A page belongs to its book only (`collection_id` stays null); it moves when the book moves.
 *
 * Conventions:
 * - IDs are text UUIDs from `newId()`.
 * - Timestamps are stored as epoch milliseconds.
 * - Colors are stored by name (see `itemColors` in the theme), never as hex.
 * - Keep this file free of app imports: drizzle-kit loads it in Node.
 */
import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
};

export const collections = sqliteTable('collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('slate'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  /** Opening it asks for the lock PIN or password. Locks everything inside too. */
  isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

export const books = sqliteTable(
  'books',
  {
    id: text('id').primaryKey(),
    /** Null: at the top level. */
    collectionId: text('collection_id').references(() => collections.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('slate'),
    isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index('books_collection_idx').on(t.collectionId)],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    /** Set for a loose note in a collection. Null for top level notes and for pages. */
    collectionId: text('collection_id').references(() => collections.id, { onDelete: 'cascade' }),
    /** Set for a page in a book. */
    bookId: text('book_id').references(() => books.id, { onDelete: 'cascade' }),
    /** Order of a page within its book (ascending). Unused for loose notes. */
    position: real('position').notNull().default(0),
    title: text('title').notNull().default(''),
    /** Rich text editor document (TipTap JSON string). */
    contentJson: text('content_json').notNull().default('{}'),
    /** Plain text copy of the content, used for previews and (later) search. */
    contentText: text('content_text').notNull().default(''),
    color: text('color').notNull().default('slate'),
    isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('notes_collection_idx').on(t.collectionId),
    index('notes_book_idx').on(t.bookId, t.position),
    check('notes_one_parent', sql`${t.collectionId} is null or ${t.bookId} is null`),
  ],
);

/** Small app settings (sort orders and the like), as JSON values by key. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Note = typeof notes.$inferSelect;
