/**
 * Note documents are stored as TipTap (ProseMirror) JSON. These helpers work on that JSON without
 * the editor, so previews and search text are plain, testable code.
 */

export interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

export interface Doc extends DocNode {
  type: 'doc';
}

export function emptyDoc(): Doc {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

/** Blocks that hold text directly and end a line. Containers (lists, quotes) just hold these. */
const TEXT_BLOCKS = new Set(['paragraph', 'heading', 'codeBlock', 'horizontalRule']);

/** Plain text of a document, one block per line. */
export function docToPlainText(doc: DocNode): string {
  const lines: string[] = [];
  let current = '';

  const flush = () => {
    lines.push(current);
    current = '';
  };

  const walk = (node: DocNode) => {
    if (node.type === 'text') {
      current += node.text ?? '';
      return;
    }
    if (node.type === 'hardBreak') {
      flush();
      return;
    }
    const isTextBlock = TEXT_BLOCKS.has(node.type);
    if (isTextBlock && current) flush();
    node.content?.forEach(walk);
    if (isTextBlock) flush();
  };

  walk(doc);
  if (current) flush();

  return lines
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** A document from plain text, one paragraph per line. */
export function plainTextToDoc(text: string): Doc {
  const paragraphs = text
    .split('\n')
    .map<DocNode>((line) =>
      line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' },
    );
  return { type: 'doc', content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }] };
}

export function isDocEmpty(doc: DocNode): boolean {
  return docToPlainText(doc).length === 0;
}

/** First part of the text on one line, for list previews. */
export function previewText(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** Safely reads stored JSON. Falls back to an empty document if it is damaged. */
export function parseDoc(json: string): Doc {
  try {
    const value = JSON.parse(json) as DocNode;
    if (value && value.type === 'doc') return value as Doc;
  } catch {
    // fall through
  }
  return emptyDoc();
}
