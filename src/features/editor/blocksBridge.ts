/**
 * App side of code blocks and dividers. The editor side (the TipTap nodes) is `editor-web/blocks.ts`,
 * built into `editorHtml.js` by `npm run editor:build`.
 */
import { BridgeExtension } from '@10play/tentap-editor';

import { BLOCKS_BRIDGE, BlocksMessageType, type BlocksInstance, type BlocksMessage, type BlocksState } from './blocksProtocol';

export const BlocksBridge = new BridgeExtension<BlocksState, BlocksInstance, BlocksMessage>({
  forceName: BLOCKS_BRIDGE,
  extendEditorInstance: (sendBridgeMessage) => ({
    toggleCodeBlock: () => sendBridgeMessage({ type: BlocksMessageType.toggleCodeBlock }),
    insertDivider: () => sendBridgeMessage({ type: BlocksMessageType.insertDivider }),
  }),
});

/** Reads the bridge's state, which TenTap's types don't know about. */
export function blocksState(state: object): BlocksState {
  const s = state as Partial<BlocksState>;
  return {
    isCodeBlockActive: !!s.isCodeBlockActive,
    canToggleCodeBlock: s.canToggleCodeBlock ?? true,
    canInsertDivider: s.canInsertDivider ?? true,
  };
}
