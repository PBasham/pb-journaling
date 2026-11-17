import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useBridgeState, type EditorBridge } from '@10play/tentap-editor';
import { useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import { Button, Sheet, Text, TextField } from '@/components/ui';
import { createStyles, useTheme } from '@/theme';

import { blocksState } from './blocksBridge';
import type { BlocksInstance } from './blocksProtocol';
import { highlightColor } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Level = 1 | 2 | 3;

/**
 * The formatting bar above the keyboard. The main row has the everyday tools; "Aa" opens a second
 * row with text styles (title, heading, subheading), strikethrough, inline code and highlight.
 */
export function FormatToolbar({ editor }: { editor: EditorBridge }) {
  const styles = useStyles();
  const state = useBridgeState(editor);
  const blocks = blocksState(state);
  const blockCommands = editor as EditorBridge & BlocksInstance;
  const [stylesOpen, setStylesOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selection, setSelection] = useState({ from: 0, to: 0 });

  const inTaskList = state.isTaskListActive;
  const canIndent = inTaskList ? state.canSinkTaskListItem : state.canSink;
  const canOutdent = inTaskList ? state.canLiftTaskListItem : state.canLift;

  const setHeading = (level: Level | null) => {
    const current = state.headingLevel as Level | undefined;
    if (level === null) {
      // Back to body text: toggling the current heading level off makes it a paragraph.
      if (current) editor.toggleHeading(current);
      return;
    }
    editor.toggleHeading(level);
  };

  const openLink = () => {
    setSelection({ from: state.selection.from, to: state.selection.to });
    setUrl(state.activeLink ?? '');
    setLinkOpen(true);
  };

  const applyLink = (value: string | null) => {
    setLinkOpen(false);
    // Focusing the link field can drop the editor's selection (Android): put it back first.
    if (Platform.OS === 'android') editor.setSelection(selection.from, selection.to);
    const trimmed = value?.trim();
    if (!trimmed) {
      editor.setLink(null);
      return;
    }
    editor.setLink(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  };

  return (
    <View style={styles.bar}>
      {stylesOpen ? (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          style={styles.subRow}>
          <StyleChip label="Body" icon="format-paragraph" active={!state.headingLevel} onPress={() => setHeading(null)} />
          <StyleChip label="Title" icon="format-header-1" active={state.headingLevel === 1} onPress={() => setHeading(1)} />
          <StyleChip label="Heading" icon="format-header-2" active={state.headingLevel === 2} onPress={() => setHeading(2)} />
          <StyleChip label="Subheading" icon="format-header-3" active={state.headingLevel === 3} onPress={() => setHeading(3)} />
          <View style={styles.divider} />
          <Tool icon="format-strikethrough" label="Strikethrough" active={state.isStrikeActive} disabled={!state.canToggleStrike} onPress={() => editor.toggleStrike()} />
          <Tool icon="code-tags" label="Inline code" active={state.isCodeActive} disabled={!state.canToggleCode} onPress={() => editor.toggleCode()} />
          <Tool
            icon="code-braces-box"
            label="Code block"
            active={blocks.isCodeBlockActive}
            disabled={!blocks.canToggleCodeBlock}
            onPress={() => blockCommands.toggleCodeBlock()}
          />
          <Tool icon="minus" label="Divider" disabled={!blocks.canInsertDivider} onPress={() => blockCommands.insertDivider()} />
          <Tool
            icon="marker"
            label="Highlight"
            active={!!state.activeHighlight}
            onPress={() => (state.activeHighlight ? editor.unsetHighlight() : editor.toggleHighlight(highlightColor))}
          />
        </ScrollView>
      ) : null}
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <Tool icon="format-text" label="Text styles" active={stylesOpen || !!state.headingLevel} onPress={() => setStylesOpen((o) => !o)} />
        <Tool icon="format-bold" label="Bold" active={state.isBoldActive} disabled={!state.canToggleBold} onPress={() => editor.toggleBold()} />
        <Tool icon="format-italic" label="Italic" active={state.isItalicActive} disabled={!state.canToggleItalic} onPress={() => editor.toggleItalic()} />
        <Tool icon="format-underline" label="Underline" active={state.isUnderlineActive} disabled={!state.canToggleUnderline} onPress={() => editor.toggleUnderline()} />
        <View style={styles.divider} />
        <Tool icon="format-list-bulleted" label="Bulleted list" active={state.isBulletListActive} disabled={!state.canToggleBulletList} onPress={() => editor.toggleBulletList()} />
        <Tool icon="format-list-numbered" label="Numbered list" active={state.isOrderedListActive} disabled={!state.canToggleOrderedList} onPress={() => editor.toggleOrderedList()} />
        <Tool icon="format-list-checks" label="Checklist" active={state.isTaskListActive} disabled={!state.canToggleTaskList} onPress={() => editor.toggleTaskList()} />
        <Tool icon="format-quote-close" label="Quote" active={state.isBlockquoteActive} disabled={!state.canToggleBlockquote} onPress={() => editor.toggleBlockquote()} />
        <Tool
          icon="format-indent-increase"
          label="Indent"
          disabled={!canIndent}
          onPress={() => (inTaskList ? editor.sinkTaskListItem() : editor.sink())}
        />
        <Tool
          icon="format-indent-decrease"
          label="Outdent"
          disabled={!canOutdent}
          onPress={() => (inTaskList ? editor.liftTaskListItem() : editor.lift())}
        />
        <View style={styles.divider} />
        <Tool icon="link-variant" label="Link" active={state.isLinkActive} disabled={!state.isLinkActive && !state.canSetLink} onPress={openLink} />
        <Tool icon="undo" label="Undo" disabled={!state.canUndo} onPress={() => editor.undo()} />
        <Tool icon="redo" label="Redo" disabled={!state.canRedo} onPress={() => editor.redo()} />
        <Tool icon="keyboard-close" label="Hide keyboard" onPress={() => editor.blur()} />
      </ScrollView>

      <Sheet visible={linkOpen} onClose={() => setLinkOpen(false)}>
        <Text variant="heading">{state.isLinkActive ? 'Edit link' : 'Add a link'}</Text>
        <TextField
          label="Web address"
          value={url}
          onChangeText={setUrl}
          placeholder="example.com"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={() => applyLink(url)}
        />
        <Button title="Save link" disabled={!url.trim()} onPress={() => applyLink(url)} />
        {state.isLinkActive ? <Button title="Remove link" variant="danger" onPress={() => applyLink(null)} /> : null}
      </Sheet>
    </View>
  );
}

function Tool({
  icon,
  label,
  active,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={2}
      style={({ pressed }) => [styles.tool, active && styles.toolActive, pressed && styles.pressed, disabled && styles.disabled]}>
      <MaterialCommunityIcons name={icon} size={22} color={active ? theme.colors.primary : theme.colors.text} />
    </Pressable>
  );
}

function StyleChip({ label, icon, active, onPress }: { label: string; icon: IconName; active: boolean; onPress: () => void }) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.toolActive, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={icon} size={18} color={active ? theme.colors.primary : theme.colors.textMuted} />
      <Text variant="caption" color={active ? 'primary' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const TOOL_SIZE = 40;

const useStyles = createStyles((t) => ({
  bar: {
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  subRow: {
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  row: {
    alignItems: 'center',
    gap: t.spacing.xxs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs,
  },
  tool: {
    width: TOOL_SIZE,
    height: TOOL_SIZE,
    borderRadius: t.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolActive: { backgroundColor: t.colors.primarySoft },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    height: TOOL_SIZE - t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceMuted,
  },
  divider: {
    width: 1,
    height: TOOL_SIZE - t.spacing.md,
    backgroundColor: t.colors.border,
    marginHorizontal: t.spacing.xs,
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
}));
