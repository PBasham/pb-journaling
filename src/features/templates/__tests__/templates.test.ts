import { describe, expect, it, jest } from '@jest/globals';

import { createTestDb } from '../../../../test/testDb';
import { docToPlainText } from '../../editor/document';
import { doc, p } from '../../editor/build';
import { builtInTemplates, deleteTemplate, listTemplates, saveTemplate, seedTemplates, templateDoc } from '../templates';

jest.mock('expo-sqlite', () => ({}));

describe('templates', () => {
  it('seeds built in templates once and keeps their order', async () => {
    const db = createTestDb();
    await seedTemplates(db);
    await seedTemplates(db);
    const list = await listTemplates(db);
    expect(list.map((t) => t.id)).toEqual(builtInTemplates.map((t) => t.id));
    expect(docToPlainText(templateDoc(list[0]))).toContain('Ingredients');
  });

  it('lists saved templates first and deletes them', async () => {
    const db = createTestDb();
    await seedTemplates(db);
    const id = await saveTemplate(db, { name: ' Weekly review ', title: 'Week', doc: doc(p('Wins')) });
    const list = await listTemplates(db);
    expect(list[0]).toMatchObject({ id, name: 'Weekly review', title: 'Week', isBuiltIn: false });
    await deleteTemplate(db, id);
    expect((await listTemplates(db)).find((t) => t.id === id)).toBeUndefined();
  });
});
