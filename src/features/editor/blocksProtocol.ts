/**
 * Shared by both halves of the code block and divider bridge: the app (`blocksBridge.ts`) and the
 * editor page (`editor-web/blocks.ts`). Plain types and constants only, no imports.
 */

/** The bridge's name on both sides. It matches the code block node, which the web side is named after. */
export const BLOCKS_BRIDGE = 'codeBlock';

export enum BlocksMessageType {
  toggleCodeBlock = 'pb-toggle-code-block',
  insertDivider = 'pb-insert-divider',
}

export type BlocksMessage = { type: BlocksMessageType; payload?: undefined };

export interface BlocksState {
  isCodeBlockActive: boolean;
  canToggleCodeBlock: boolean;
  canInsertDivider: boolean;
}

export interface BlocksInstance {
  toggleCodeBlock: () => void;
  insertDivider: () => void;
}
