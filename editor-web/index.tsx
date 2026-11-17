/**
 * The note editor page that runs inside the WebView: TenTap's editor plus code blocks and dividers.
 * Build with `npm run editor:build` after changing anything in this folder.
 */
// TenTap's source (like its own default editor page), so everything shares one TipTap copy.
import '@10play/tentap-editor/src/web/globals.ts';
import { TenTapStartKit } from '@10play/tentap-editor/src/bridges/StarterKit.ts';
import { boot } from '@10play/tentap-editor/src/web/runtime.ts';
import { useTenTap } from '@10play/tentap-editor/src/web/useTenTap.tsx';
import { EditorContent } from '@tiptap/react';
import { createRoot } from 'react-dom/client';

import { BlocksWebBridge } from './blocks';

function Editor() {
  const editor = useTenTap({ bridges: [...TenTapStartKit, BlocksWebBridge] });
  const { dynamicHeight } = boot().requireConfig();
  return <EditorContent editor={editor} className={dynamicHeight ? 'tentap-root dynamic-height' : 'tentap-root'} />;
}

const runtime = boot();
runtime.whenConfigured(() => {
  try {
    createRoot(document.getElementById('root')!).render(<Editor />);
  } catch (error) {
    runtime.reportBootError(error);
    throw error;
  }
});
