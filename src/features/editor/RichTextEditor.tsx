import {
  darkEditorTheme,
  defaultEditorTheme,
  EditorKeyboardAvoidingView,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
  type EditorBridge,
  type EditorTheme,
} from '@10play/tentap-editor';
import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from 'react';
import { View } from 'react-native';

import { createStyles, useTheme, type Theme } from '@/theme';

import type { Doc } from './document';

type BridgeTheme = NonNullable<Parameters<typeof useEditorBridge>[0]>['theme'];

export interface RichTextEditorHandle {
  /**
   * The document as it is right now. Changes reach `onChange` after a short pause in typing, so
   * read this before leaving to catch the last few words. Null if the editor doesn't answer in time.
   */
  getDoc: () => Promise<Doc | null>;
  focus: () => void;
}

interface RichTextEditorProps {
  /** Content when the editor opens. Later changes to this prop are ignored. */
  initialDoc: Doc;
  /** Called with the latest document, debounced while typing. */
  onChange: (doc: Doc) => void;
  placeholder?: string;
  autofocus?: boolean;
  ref?: Ref<RichTextEditorHandle>;
}

/** How long to wait for the editor's web view before leaving without its latest words. */
const GET_DOC_TIMEOUT_MS = 500;

/**
 * The one place the app touches the editor library (TenTap, built on TipTap).
 * Everything else works with the `Doc` JSON from `./document`.
 */
export function RichTextEditor({ initialDoc, onChange, placeholder = 'Start writing…', autofocus, ref }: RichTextEditorProps) {
  const theme = useTheme();
  const styles = useStyles();
  const base: EditorTheme = theme.scheme === 'dark' ? darkEditorTheme : defaultEditorTheme;
  const editorTheme: EditorTheme = {
    ...base,
    webview: { backgroundColor: theme.colors.background },
    webviewContainer: { backgroundColor: theme.colors.background },
  };
  const editor = useEditorBridge({
    initialContent: initialDoc,
    autofocus,
    avoidIosKeyboard: true,
    bridgeExtensions: [...TenTapStartKit, PlaceholderBridge.configureExtension({ placeholder })],
    // Cast through unknown: checking EditorTheme against the library's RecursivePartial type
    // exceeds TypeScript's depth limit. The value is a full EditorTheme, so it is valid.
    theme: editorTheme as unknown as BridgeTheme,
  });

  useEffect(() => {
    editor.injectCSS(editorCss(theme), 'pb-notes-theme');
  }, [editor, theme]);

  useImperativeHandle(
    ref,
    () => ({
      getDoc: () =>
        Promise.race([
          editor.getJSON().then((json) => json as Doc),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), GET_DOC_TIMEOUT_MS)),
        ]).catch(() => null),
      focus: () => editor.focus(),
    }),
    [editor],
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useDocUpdates(editor, onChangeRef);

  return (
    <EditorKeyboardAvoidingView style={styles.fill}>
      <View style={styles.fill}>
        <RichText editor={editor} />
      </View>
      <View style={styles.toolbar}>
        <Toolbar editor={editor} />
      </View>
    </EditorKeyboardAvoidingView>
  );
}

/** Pause in typing before the document is read from the editor. */
const CONTENT_DEBOUNCE_MS = 150;

/**
 * Reads the document after each change and passes it on. A read that's pending when the editor
 * closes still gets delivered, so the last words typed before leaving are saved.
 */
function useDocUpdates(editor: EditorBridge, onChangeRef: RefObject<(doc: Doc) => void>) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sent = 0;
    let delivered = 0;
    const read = () => {
      const request = ++sent;
      editor
        .getJSON()
        .then((json) => {
          // Answers can arrive out of order; never let an older one replace a newer one.
          if (request < delivered) return;
          delivered = request;
          onChangeRef.current(json as Doc);
        })
        .catch(() => {});
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        read();
      }, CONTENT_DEBOUNCE_MS);
    };
    const unsubscribe = editor._subscribeToContentUpdate(schedule);
    return () => {
      unsubscribe();
      if (timer) {
        clearTimeout(timer);
        read();
      }
    };
  }, [editor, onChangeRef]);
}

/** Styles inside the editor's web view, from the app's theme tokens. */
function editorCss(t: Theme): string {
  const c = t.colors;
  return `
    * { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    html, body { background: ${c.background}; color: ${c.text}; }
    .ProseMirror { font-size: ${t.typography.body.fontSize + 1}px; line-height: 1.55; padding: 0 2px 48px; caret-color: ${c.primary}; }
    .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { line-height: 1.25; }
    .ProseMirror blockquote { border-left: 3px solid ${c.primary}; margin-left: 0; padding-left: ${t.spacing.md}px; color: ${c.textMuted}; }
    .ProseMirror a { color: ${c.primary}; }
    .ProseMirror code { background: ${c.surfaceMuted}; border-radius: ${t.spacing.xs}px; padding: 1px ${t.spacing.xs}px; }
    .ProseMirror ul[data-type="taskList"] { padding-left: 4px; }
    .ProseMirror p.is-editor-empty:first-child::before { color: ${c.textMuted}; }
    ::selection { background: ${c.primarySoft}; }
  `;
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  toolbar: {
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));
