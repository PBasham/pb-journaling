import {
  darkEditorTheme,
  defaultEditorTheme,
  EditorKeyboardAvoidingView,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  useEditorBridge,
  type EditorBridge,
  type EditorTheme,
} from '@10play/tentap-editor';
import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from 'react';
import { View } from 'react-native';

import { createStyles, useTheme, type Theme } from '@/theme';

import type { Doc } from './document';
import { FormatToolbar } from './FormatToolbar';

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
      <FormatToolbar editor={editor} />
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
    .ProseMirror { font-size: ${t.typography.body.fontSize + 1}px; line-height: 1.55; padding: 0 ${t.spacing.lg}px 48px; caret-color: ${c.primary}; }
    .ProseMirror h1 { font-size: ${t.typography.title.fontSize + 2}px; line-height: 1.25; margin: 0.9em 0 0.35em; font-weight: 700; }
    .ProseMirror h2 { font-size: ${t.typography.heading.fontSize + 2}px; line-height: 1.3; margin: 0.8em 0 0.3em; font-weight: 700; }
    .ProseMirror h3 { font-size: ${t.typography.body.fontSize + 1}px; line-height: 1.35; margin: 0.7em 0 0.25em; font-weight: 700; color: ${c.textMuted}; text-transform: uppercase; letter-spacing: 0.04em; }
    .ProseMirror > :first-child { margin-top: 0; }
    .ProseMirror p { margin: 0 0 0.6em; }
    .ProseMirror ul, .ProseMirror ol { padding-left: 1.4em; margin: 0 0 0.6em; }
    .ProseMirror li > p { margin: 0.15em 0; }
    .ProseMirror li::marker { color: ${c.primary}; }
    .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.2em; }
    .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
    .ProseMirror ul[data-type="taskList"] li > label { margin-top: 0.2em; }
    .ProseMirror ul[data-type="taskList"] li > div { flex: 1; }
    .ProseMirror ul[data-type="taskList"] input[type="checkbox"] { width: 1.05em; height: 1.05em; accent-color: ${c.primary}; }
    .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div { color: ${c.textMuted}; text-decoration: line-through; }
    .ProseMirror mark { border-radius: 3px; padding: 0 1px; color: inherit; }
    .ProseMirror blockquote { border-left: 3px solid ${c.primary}; margin-left: 0; padding-left: ${t.spacing.md}px; color: ${c.textMuted}; }
    .ProseMirror a { color: ${c.primary}; }
    .ProseMirror code { background: ${c.surfaceMuted}; border-radius: ${t.spacing.xs}px; padding: 1px ${t.spacing.xs}px; }
    .ProseMirror p.is-editor-empty:first-child::before { color: ${c.textMuted}; }
    ::selection { background: ${c.primarySoft}; }
  `;
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
}));
