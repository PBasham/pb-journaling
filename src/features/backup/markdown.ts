/** Markdown export: the whole library as one readable file, no app needed. */
import type { Book, Collection, Note } from '@/db/schema';

import { parseDoc, type DocNode } from '../editor/document';

/** Characters that would start Markdown formatting in plain text. */
const escape = (t: string) => t.replace(/([\\`*_[\]])/g, '\\$1');

/** Escapes what would turn a line into a heading, quote or list. */
const escapeLineStart = (line: string) => line.replace(/^(\s*)([#>+-]|\d+\.)(\s)/, '$1\\$2$3');

function inline(nodes: DocNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type === 'hardBreak') return '  \n';
      if (n.type !== 'text') return inline(n.content);
      const out = escape(n.text ?? '');
      if (!out.trim()) return out;
      const marks = new Set((n.marks ?? []).map((m) => m.type));
      // Keep surrounding spaces outside the markers, or Markdown ignores them.
      const [, lead, core, trail] = /^(\s*)(.*?)(\s*)$/s.exec(out)!;
      let text = core;
      if (marks.has('code')) text = `\`${core.replace(/\\(.)/g, '$1')}\``;
      if (marks.has('bold')) text = `**${text}**`;
      if (marks.has('italic')) text = `*${text}*`;
      if (marks.has('strike')) text = `~~${text}~~`;
      const link = n.marks?.find((m) => m.type === 'link');
      if (link && typeof link.attrs?.href === 'string') text = `[${text}](${link.attrs.href})`;
      return lead + text + trail;
    })
    .join('');
}

function block(node: DocNode, headingOffset: number): string[] {
  switch (node.type) {
    case 'paragraph':
      return [escapeLineStart(inline(node.content))];
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 2)));
      return [`${'#'.repeat(Math.min(6, level + headingOffset))} ${inline(node.content)}`];
    }
    case 'blockquote':
      return blocks(node.content, headingOffset).map((l) => (l ? `> ${l}` : '>'));
    case 'bulletList':
    case 'orderedList':
    case 'taskList': {
      const lines: string[] = [];
      (node.content ?? []).forEach((item, i) => {
        const marker =
          node.type === 'orderedList' ? `${i + 1}.` : node.type === 'taskList' ? `- [${item.attrs?.checked ? 'x' : ' '}]` : '-';
        const inner = blocks(item.content, headingOffset, true);
        inner.forEach((l, j) => lines.push(j === 0 ? `${marker} ${l}` : l ? `  ${l}` : ''));
      });
      return lines;
    }
    case 'codeBlock':
      return ['```', (node.content ?? []).map((n) => n.text ?? '').join(''), '```'];
    case 'horizontalRule':
      return ['---'];
    default:
      return node.content ? blocks(node.content, headingOffset) : [];
  }
}

/** Blocks separated by blank lines, or packed together inside a list item. */
function blocks(nodes: DocNode[] | undefined, headingOffset: number, tight = false): string[] {
  const out: string[] = [];
  for (const n of nodes ?? []) {
    if (out.length && !tight) out.push('');
    out.push(...block(n, headingOffset));
  }
  return out;
}

/** A document as Markdown. Its headings start below `headingOffset` so they nest under the note's title. */
export function docToMarkdown(doc: DocNode, headingOffset = 0): string {
  return blocks(doc.content, headingOffset).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export interface LibraryForExport {
  collections: Collection[];
  books: Book[];
  notes: Note[];
}

/**
 * The whole library as one Markdown document: collections, their books and pages, then anything
 * at the top level. Locked items are listed by name only unless `includeLocked` is set.
 */
export function libraryToMarkdown(lib: LibraryForExport, options: { includeLocked: boolean }): string {
  const out: string[] = ['# PB Notes', ''];
  const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
  const notesIn = (collectionId: string | null) =>
    lib.notes.filter((n) => !n.bookId && n.collectionId === collectionId).sort((a, b) => a.title.localeCompare(b.title));
  const pagesOf = (bookId: string) =>
    lib.notes.filter((n) => n.bookId === bookId).sort((a, b) => a.position - b.position);

  const writeNote = (note: Note, level: number, hidden: boolean, label?: string) => {
    const title = `${label ?? ''}${note.title.trim() || 'Untitled'}`;
    out.push(`${'#'.repeat(level)} ${escape(title)}${note.isFavorite ? ' ★' : ''}`, '');
    if (hidden || (note.isLocked && !options.includeLocked)) {
      out.push('*Locked, not included.*', '');
      return;
    }
    const body = docToMarkdown(parseDoc(note.contentJson), level);
    if (body) out.push(body, '');
  };

  const writeBook = (book: Book, level: number, parentHidden: boolean) => {
    out.push(`${'#'.repeat(level)} 📖 ${escape(book.name)}${book.isFavorite ? ' ★' : ''}`, '');
    const hidden = parentHidden || (book.isLocked && !options.includeLocked);
    pagesOf(book.id).forEach((page, i) => writeNote(page, Math.min(6, level + 1), hidden, `${i + 1}. `));
  };

  for (const collection of [...lib.collections].sort(byName)) {
    out.push(`## ${escape(collection.name)}${collection.isFavorite ? ' ★' : ''}`, '');
    const hidden = collection.isLocked && !options.includeLocked;
    for (const book of lib.books.filter((b) => b.collectionId === collection.id).sort(byName)) writeBook(book, 3, hidden);
    for (const note of notesIn(collection.id)) writeNote(note, 3, hidden);
  }

  const looseBooks = lib.books.filter((b) => !b.collectionId).sort(byName);
  const looseNotes = notesIn(null);
  if (looseBooks.length || looseNotes.length) {
    out.push('## Not in a collection', '');
    for (const book of looseBooks) writeBook(book, 3, false);
    for (const note of looseNotes) writeNote(note, 3, false);
  }
  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}
