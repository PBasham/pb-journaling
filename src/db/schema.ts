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
import { check, index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** Shared by collections, books and notes. */
const itemFlags = {
  /** Shown first in its list. */
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  /**
   * Set when moved to Recently deleted. Rows deleted together share the same time, so restoring a
   * collection or book brings back exactly what was deleted with it. Gone for good after 30 days.
   */
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
};

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
  ...itemFlags,
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
    ...itemFlags,
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
    /** When it was last opened, for "Continue writing". */
    lastOpenedAt: integer('last_opened_at', { mode: 'timestamp_ms' }),
    ...itemFlags,
    ...timestamps,
  },
  (t) => [
    index('notes_collection_idx').on(t.collectionId),
    index('notes_book_idx').on(t.bookId, t.position),
    check('notes_one_parent', sql`${t.collectionId} is null or ${t.bookId} is null`),
  ],
);

/** Tags people put on notes and pages, used to filter search. */
export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull().default('slate'),
    ...timestamps,
  },
  (t) => [uniqueIndex('tags_name_idx').on(sql`lower(${t.name})`)],
);

export const noteTags = sqliteTable(
  'note_tags',
  {
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.tagId] }), index('note_tags_tag_idx').on(t.tagId)],
);

/** Layouts a new note can start from. Built in ones are seeded by the app with fixed ids (`builtin-…`). */
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** Title the new note gets, or empty. */
  title: text('title').notNull().default(''),
  /** Rich text document (TipTap JSON string). */
  contentJson: text('content_json').notNull(),
  isBuiltIn: integer('is_built_in', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

/**
 * Photos attached to a note. The image is a file in the app's private storage
 * (`photos/<fileName>`); this row says which note it belongs to and in what order.
 */
export const notePhotos = sqliteTable(
  'note_photos',
  {
    id: text('id').primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    position: real('position').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('note_photos_note_idx').on(t.noteId, t.position)],
);

/** Small app settings (sort orders and the like), as JSON values by key. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type NotePhoto = typeof notePhotos.$inferSelect;
