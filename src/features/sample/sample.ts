/**
 * Example content: a small library to explore on first launch, and bigger generated data sets for
 * testing (from the developer tools). Everything goes through the normal library functions.
 */
import { sql } from 'drizzle-orm';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';
import { newId } from '@/lib/id';
import { itemColorNames } from '@/theme/tokens';

import { doc, h, hr, ol, p, quote, tasks, ul } from '../editor/build';
import { createBook, createCollection, createNote, updateBook, updateCollection, updateNote } from '../library/library';
import { findOrCreateTag, setItemTags, setNoteTags } from '../tags/tags';

/** A small, realistic library: collections, books with pages, loose notes, tags, a favorite and a pin. */
export async function createSampleLibrary(db: Database): Promise<void> {
  const recipe = await findOrCreateTag(db, 'recipe', 'orange');
  const todo = await findOrCreateTag(db, 'todo', 'blue');
  const travel = await findOrCreateTag(db, 'travel', 'teal');

  const recipes = await createCollection(db, { name: 'Recipes', color: 'orange' });
  await updateCollection(db, recipes, { isFavorite: true });
  await setItemTags(db, 'collection', recipes, [recipe.id]);

  const weeknight = await createBook(db, { name: 'Weeknight dinners', color: 'green', collectionId: recipes });
  const pages: [string, ReturnType<typeof doc>][] = [
    [
      'Lentil soup',
      doc(
        p('Serves 4 · 40 minutes'),
        h(2, 'Ingredients'),
        ul('1 cup red lentils', '1 onion, diced', '2 carrots', '1 tsp cumin', '4 cups stock'),
        h(2, 'Steps'),
        ol('Soften the onion and carrots in oil.', 'Add cumin, lentils and stock.', 'Simmer 25 minutes, then blend half.'),
      ),
    ],
    [
      'Sheet pan chicken',
      doc(
        p('Serves 3 · 35 minutes'),
        h(2, 'Ingredients'),
        ul('Chicken thighs', 'Potatoes', 'Lemon', 'Garlic'),
        h(2, 'Steps'),
        ol('Heat the oven to 425°F.', 'Toss everything with oil and salt.', 'Roast 30 minutes.'),
      ),
    ],
    ['Tofu stir fry', doc(p('Use the firm tofu. Press it for 10 minutes first.'), h(2, 'Sauce'), ul('Soy sauce', 'Maple syrup', 'Ginger'))],
  ];
  for (const [title, content] of pages) {
    const id = await createNote(db, { bookId: weeknight }, { title, doc: content });
    await setNoteTags(db, id, [recipe.id]);
  }

  const baking = await createBook(db, { name: 'Baking', color: 'amber', collectionId: recipes });
  await createNote(db, { bookId: baking }, {
    title: 'Sourdough',
    doc: doc(quote('Patience is the main ingredient.'), h(2, 'Schedule'), tasks(['Feed starter', true], 'Mix dough', 'Bulk ferment', 'Shape and bake')),
  });
  await createNote(db, { bookId: baking }, { title: 'Banana bread', doc: doc(p('3 very ripe bananas. 350°F for 60 minutes.')) });

  const staples = await createNote(db, { collectionId: recipes }, {
    title: 'Pantry staples',
    color: 'orange',
    doc: doc(tasks(['Olive oil', true], 'Rice', 'Canned tomatoes', 'Onions')),
  });
  await setNoteTags(db, staples, [todo.id]);

  const work = await createCollection(db, { name: 'Work', color: 'blue' });
  const meeting = await createNote(db, { collectionId: work }, {
    title: 'Team sync',
    doc: doc(p('Who: Sam, Priya, me'), h(2, 'Notes'), ul('Release moved to Friday', 'New design review process'), h(2, 'Action items'), tasks('Send the summary', 'Book the review room')),
  });
  await setNoteTags(db, meeting, [todo.id]);

  const trip = await createBook(db, { name: 'Maine trip', color: 'teal', collectionId: null });
  await updateBook(db, trip, { isFavorite: true });
  await setItemTags(db, 'book', trip, [travel.id]);
  for (const [title, body] of [
    ['Plan', doc(h(2, 'Places'), ul('Acadia', 'Bar Harbor', 'Portland'), hr(), h(3, 'Packing'), tasks('Hiking boots', 'Rain jacket'))],
    ['Day 1', doc(p('Drove up the coast. Lobster roll in Portland was worth the line.'))],
  ] as const) {
    const id = await createNote(db, { bookId: trip }, { title, doc: body });
    await setNoteTags(db, id, [travel.id]);
  }

  const ideas = await createNote(db, { collectionId: null }, {
    title: 'Ideas',
    color: 'purple',
    doc: doc(ul('A notes app organized like a bookshelf', 'Learn to make pasta from scratch', 'Plant tomatoes in May')),
  });
  await updateNote(db, ideas, { isPinned: true });
  await createNote(db, { collectionId: null }, { title: 'Welcome', doc: doc(p('Long press anything for options. Tap + to add a note, book or collection.')) });
}

const words =
  'note page plan idea list garden trip book recipe meeting project draft summary week goal habit morning evening coffee walk read write call email budget home work family friend music movie travel weekend'.split(
    ' ',
  );

/** Deterministic pseudo random numbers, so generated data looks the same each time. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Lots of data for testing speed and scrolling. With the defaults: 20 collections, 100 books,
 * 1,000 pages and 200 loose notes.
 */
export async function createBulkData(
  db: Database,
  size = { collections: 20, booksPerCollection: 5, pagesPerBook: 10, looseNotes: 200 },
): Promise<void> {
  const rand = random(42);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const phrase = (n: number) => Array.from({ length: n }, () => pick(words)).join(' ');
  const title = () => phrase(2).replace(/^./, (c) => c.toUpperCase());

  for (let c = 0; c < size.collections; c++) {
    const collection = await createCollection(db, { name: `${title()} ${c + 1}`, color: pick(itemColorNames) });
    for (let b = 0; b < size.booksPerCollection; b++) {
      const book = await createBook(db, { name: title(), color: pick(itemColorNames), collectionId: collection });
      for (let n = 0; n < size.pagesPerBook; n++) {
        await createNote(db, { bookId: book }, { title: title(), doc: doc(p(phrase(30)), ul(phrase(4), phrase(5))) });
      }
    }
  }
  for (let n = 0; n < size.looseNotes; n++) {
    await createNote(db, { collectionId: null }, { title: title(), doc: doc(p(phrase(40))), color: pick(itemColorNames) });
  }
}

/** A note that has been in Recently deleted for `days` days, to test the 30 day clean up. */
export async function createOldDeletedNote(db: Database, days: number): Promise<void> {
  const at = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await db.insert(schema.notes).values({
    id: newId(),
    title: `Deleted ${days} days ago`,
    contentJson: JSON.stringify(doc(p('For testing Recently deleted.'))),
    contentText: 'For testing Recently deleted.',
    deletedAt: at,
    createdAt: at,
    updatedAt: at,
  });
}

/** Deletes every collection, book, note, tag and saved template for good. Settings stay. */
export async function eraseLibrary(db: Database): Promise<void> {
  db.transaction((tx) => {
    tx.delete(schema.noteTags).run();
    tx.delete(schema.bookTags).run();
    tx.delete(schema.collectionTags).run();
    tx.delete(schema.notePhotos).run();
    tx.delete(schema.notes).run();
    tx.delete(schema.books).run();
    tx.delete(schema.collections).run();
    tx.delete(schema.tags).run();
    tx.run(sql`delete from ${schema.templates} where ${schema.templates.isBuiltIn} = 0`);
  });
}

/** Counts for the developer tools. */
export async function countEverything(db: Database) {
  const count = async (table: string) =>
    Number((await db.all<{ n: number }>(sql.raw(`select count(*) as n from "${table}"`)))[0]?.n ?? 0);
  return {
    collections: await count('collections'),
    books: await count('books'),
    notes: await count('notes'),
    tags: await count('tags'),
    templates: await count('templates'),
    photos: await count('note_photos'),
  };
}
