/**
 * Small helpers for writing documents in code (templates, sample notes, tests).
 * `doc(h(2, 'Ingredients'), ul('Flour', 'Water'))` reads like the note it makes.
 */
import type { Doc, DocNode } from './document';

const text = (value: string): DocNode[] => (value ? [{ type: 'text', text: value }] : []);
const para = (value: string): DocNode => ({ type: 'paragraph', content: text(value) });

export const doc = (...blocks: DocNode[]): Doc => ({ type: 'doc', content: blocks.length ? blocks : [para('')] });
export const p = (value = ''): DocNode => para(value);
export const h = (level: 1 | 2 | 3, value: string): DocNode => ({ type: 'heading', attrs: { level }, content: text(value) });
export const ul = (...items: string[]): DocNode => ({
  type: 'bulletList',
  content: items.map((i) => ({ type: 'listItem', content: [para(i)] })),
});
export const ol = (...items: string[]): DocNode => ({
  type: 'orderedList',
  attrs: { start: 1 },
  content: items.map((i) => ({ type: 'listItem', content: [para(i)] })),
});
export const tasks = (...items: (string | [string, boolean])[]): DocNode => ({
  type: 'taskList',
  content: items.map((i) => {
    const [label, checked] = typeof i === 'string' ? [i, false] : i;
    return { type: 'taskItem', attrs: { checked }, content: [para(label)] };
  }),
});
export const quote = (value: string): DocNode => ({ type: 'blockquote', content: [para(value)] });
export const code = (value: string): DocNode => ({ type: 'codeBlock', attrs: { language: null }, content: text(value) });
export const hr = (): DocNode => ({ type: 'horizontalRule' });
