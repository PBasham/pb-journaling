import { asc, desc, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';
import type { Template } from '@/db/schema';
import { newId } from '@/lib/id';

import { parseDoc, type Doc } from '../editor/document';
import { doc, h, hr, ol, p, quote, tasks, ul } from '../editor/build';

/**
 * Templates that come with the app. Their ids are permanent: change the content freely, but never
 * rename or reuse an id (seeding only inserts what's missing, so people's edits are kept).
 */
export const builtInTemplates: { id: string; name: string; title: string; doc: Doc }[] = [
  {
    id: 'builtin-recipe',
    name: 'Recipe',
    title: '',
    doc: doc(
      p('Serves 4 · 30 minutes'),
      h(2, 'Ingredients'),
      ul('', ''),
      h(2, 'Steps'),
      ol('', ''),
      h(2, 'Notes'),
      p(),
    ),
  },
  {
    id: 'builtin-meeting',
    name: 'Meeting notes',
    title: 'Meeting',
    doc: doc(
      p('Who:'),
      h(2, 'Agenda'),
      ul(''),
      h(2, 'Notes'),
      p(),
      h(2, 'Action items'),
      tasks(''),
    ),
  },
  {
    id: 'builtin-daily',
    name: 'Daily log',
    title: '',
    doc: doc(h(2, 'Today'), tasks('', ''), h(2, 'What happened'), p(), hr(), h(3, 'Tomorrow'), ul('')),
  },
  {
    id: 'builtin-checklist',
    name: 'Checklist',
    title: '',
    doc: doc(tasks('', '', '')),
  },
  {
    id: 'builtin-book',
    name: 'Book notes',
    title: '',
    doc: doc(
      p('Author:'),
      h(2, 'Summary'),
      p(),
      h(2, 'Favorite quotes'),
      quote(''),
      h(2, 'Takeaways'),
      ul(''),
    ),
  },
];

/** Adds built in templates that are missing. Safe to run on every launch; never overwrites changes. */
export async function seedTemplates(db: Database): Promise<void> {
  const now = new Date();
  await db
    .insert(schema.templates)
    .values(
      builtInTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        contentJson: JSON.stringify(t.doc),
        isBuiltIn: true,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing();
}

/** Saved templates first (newest first), then the built in ones in their usual order. */
export async function listTemplates(db: Database): Promise<Template[]> {
  const rows = await db.select().from(schema.templates).orderBy(asc(schema.templates.isBuiltIn), desc(schema.templates.createdAt));
  const order = new Map(builtInTemplates.map((t, i) => [t.id, i]));
  const saved = rows.filter((r) => !r.isBuiltIn);
  const builtIn = rows.filter((r) => r.isBuiltIn).sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  return [...saved, ...builtIn];
}

/** Saves a note's layout as a template. */
export async function saveTemplate(db: Database, input: { name: string; title: string; doc: Doc }): Promise<string> {
  const id = newId();
  const now = new Date();
  await db.insert(schema.templates).values({
    id,
    name: input.name.trim() || 'My template',
    title: input.title.trim(),
    contentJson: JSON.stringify(input.doc),
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function deleteTemplate(db: Database, id: string): Promise<void> {
  await db.delete(schema.templates).where(eq(schema.templates.id, id));
}

export function templateDoc(template: Template): Doc {
  return parseDoc(template.contentJson);
}
