/**
 * Editor side of code blocks and dividers. Runs inside the editor's web view, not in the app.
 * The app side is `src/features/editor/blocksBridge.ts`.
 */
// From TenTap's source, so this page uses a single copy of TipTap (two copies break the editor).
import BridgeExtension from '@10play/tentap-editor/src/bridges/base.ts';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

import { BlocksMessageType, type BlocksMessage, type BlocksState } from '../src/features/editor/blocksProtocol';

export const BlocksWebBridge = new BridgeExtension<BlocksState, object, BlocksMessage>({
  // Named after the code block node ("codeBlock"), matching BLOCKS_BRIDGE on the app side.
  tiptapExtension: CodeBlock,
  tiptapExtensionDeps: [HorizontalRule],
  onBridgeMessage: (editor, message) => {
    if (message.type === BlocksMessageType.toggleCodeBlock) {
      editor.chain().focus().toggleCodeBlock().run();
      return true;
    }
    if (message.type === BlocksMessageType.insertDivider) {
      editor.chain().focus().setHorizontalRule().run();
      return true;
    }
    return false;
  },
  extendEditorState: (editor) => ({
    isCodeBlockActive: editor.isActive('codeBlock'),
    canToggleCodeBlock: editor.can().chain().toggleCodeBlock().run(),
    canInsertDivider: editor.can().chain().setHorizontalRule().run(),
  }),
});
