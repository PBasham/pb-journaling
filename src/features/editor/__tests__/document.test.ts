import { describe, expect, it } from '@jest/globals';

import { docToPlainText, isDocEmpty, parseDoc, plainTextToDoc, previewText } from '../document';

describe('document helpers', () => {
  it('turns blocks and lists into lines', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
          ],
        },
      ],
    };
    expect(docToPlainText(doc)).toBe('Title\none\ntwo');
  });

  it('round trips plain text', () => {
    expect(docToPlainText(plainTextToDoc('a\n\nb'))).toBe('a\n\nb');
  });

  it('treats a blank document as empty', () => {
    expect(isDocEmpty(plainTextToDoc(''))).toBe(true);
    expect(isDocEmpty(plainTextToDoc('x'))).toBe(false);
  });

  it('falls back to an empty document for damaged JSON', () => {
    expect(parseDoc('{').type).toBe('doc');
    expect(parseDoc('{}').content).toEqual([{ type: 'paragraph' }]);
  });

  it('shortens previews on one line', () => {
    expect(previewText('a\nb   c')).toBe('a b c');
    expect(previewText('x'.repeat(10), 5)).toBe('xxxx…');
  });
});
