import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, IconButton, Screen, Text } from '@/components/ui';
import { useDb } from '@/db';
import type { Note } from '@/db/schema';
import { isDocEmpty, parseDoc, type Doc } from '@/features/editor/document';
import { RichTextEditor, type RichTextEditorHandle } from '@/features/editor/RichTextEditor';
import { useNoteDraft } from '@/features/editor/useNoteDraft';
import { ItemActions, type ActionTarget } from '@/features/library/components';
import { ItemLockGate } from '@/features/lock';
import { markOpened, updateNote } from '@/features/library/library';
import { useBook, useCollection, useNote, usePages } from '@/features/library/queries';
import { AddPhotoSheet } from '@/features/photos/components/AddPhotoSheet';
import { PhotoStrip } from '@/features/photos/components/PhotoStrip';
import { PhotoViewer } from '@/features/photos/components/PhotoViewer';
import { cleanOrphanPhotos } from '@/features/photos/cleanup';
import { removePhoto } from '@/features/photos/photos';
import { useNotePhotos } from '@/features/photos/queries';
import { PHOTOS_SUPPORTED } from '@/features/photos/storage';
import { ItemTagRow } from '@/features/tags/components/ItemTagRow';
import { TemplateRow } from '@/features/templates/components/TemplateRow';
import { templateDoc } from '@/features/templates/templates';
import { run } from '@/lib/errors';
import { createStyles, itemColorValue, useTheme } from '@/theme';

export default function NoteScreen() {
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
  const { data: note, loaded } = useNote(id);
  // The editor opens with the note as it was when the screen opened; later reads only update the header.
  const [initial, setInitial] = useState<Note | undefined>(undefined);
  if (!initial && note) setInitial(note);

  if (loaded && !note && !initial) {
    return (
      <Screen safeTop={false}>
        <EmptyState icon="document-outline" title="This note is gone" message="It may have been deleted." />
      </Screen>
    );
  }
  if (!initial) return null;
  return (
    <ItemLockGate kind="note" id={initial.id} name={initial.title || undefined}>
      <NoteEditor key={initial.id} initial={initial} current={note ?? initial} isNew={isNew === '1'} />
    </ItemLockGate>
  );
}

function NoteEditor({ initial, current, isNew }: { initial: Note; current: Note; isNew: boolean }) {
  const db = useDb();
  const styles = useStyles();
  const theme = useTheme();
  const draft = useNoteDraft(initial, isNew);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [title, setTitle] = useState(initial.title);
  const [target, setTarget] = useState<ActionTarget | null>(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const { data: photos } = useNotePhotos(initial.id);
  // Templates are offered on a new note until something is written in it.
  const [offerTemplates, setOfferTemplates] = useState(isNew && isDocEmpty(parseDoc(initial.contentJson)));

  useEffect(() => {
    run(markOpened(db, initial.id));
  }, [db, initial.id]);

  const onDoc = (doc: Doc) => {
    if (offerTemplates && !isDocEmpty(doc)) setOfferTemplates(false);
    draft.setDoc(doc);
  };

  return (
    <SafeAreaView style={styles.fill} edges={['left', 'right', 'bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon={current.isFavorite ? 'star' : 'star-outline'}
                label={current.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                onPress={() =>
                  run(updateNote(db, current.id, { isFavorite: !current.isFavorite }), 'Could not change the favorite.')
                }
              />
              {PHOTOS_SUPPORTED ? (
                <IconButton icon="camera-outline" label="Add photos" onPress={() => setPhotoSheet(true)} />
              ) : null}
              <IconButton
                icon="ellipsis-horizontal-circle-outline"
                label="Note options"
                onPress={() => setTarget({ kind: 'note', item: { ...current, title } })}
              />
            </View>
          ),
        }}
      />
      <View style={styles.head}>
        <Breadcrumb note={current} />
        <View style={styles.titleRow}>
          <View style={[styles.colorDot, { backgroundColor: itemColorValue(theme, current.color) }]} />
          <TextInput
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              draft.setTitle(text);
            }}
            placeholder="Title"
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.primary}
            accessibilityLabel="Title"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => editorRef.current?.focus()}
            autoFocus={isNew}
            maxLength={200}
            style={styles.title}
          />
        </View>
        <ItemTagRow kind="note" id={initial.id} />
      </View>
      {photos.length ? (
        <View style={styles.photos}>
          <PhotoStrip photos={photos} onOpen={setViewing} />
        </View>
      ) : null}
      {offerTemplates ? (
        <TemplateRow
          onPick={(template) => {
            const doc = templateDoc(template);
            editorRef.current?.setDoc(doc);
            draft.setDoc(doc);
            if (!title.trim() && template.title) {
              setTitle(template.title);
              draft.setTitle(template.title);
            }
            setOfferTemplates(false);
          }}
        />
      ) : null}
      <View style={styles.editor}>
        <RichTextEditor ref={editorRef} initialDoc={parseDoc(initial.contentJson)} onChange={onDoc} />
      </View>
      <AddPhotoSheet noteId={initial.id} visible={photoSheet} onClose={() => setPhotoSheet(false)} />
      <PhotoViewer
        key={viewing ?? -1}
        photos={photos}
        index={viewing}
        onClose={() => setViewing(null)}
        onDelete={(photo) => run(removePhoto(db, photo.id).then(() => cleanOrphanPhotos(db)), 'Could not remove the photo.')}
      />
      <ItemActions
        target={target}
        onClose={() => setTarget(null)}
        onDeleted={() => {
          draft.stop();
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

/** Where the note lives: "Recipes / Vegan · Page 3". */
function Breadcrumb({ note }: { note: Note }) {
  const { data: book } = useBook(note.bookId ?? '');
  const { data: collection } = useCollection(note.collectionId ?? book?.collectionId ?? '');
  const pages = usePages(note.bookId ?? '');
  const parts: string[] = [];
  if (collection) parts.push(collection.name);
  if (book) parts.push(book.name);
  let text = parts.join(' / ') || 'Library';
  if (book) {
    const index = pages.data.findIndex((p) => p.id === note.id);
    if (index >= 0) text += ` · Page ${index + 1} of ${pages.data.length}`;
  }
  return (
    <Text variant="caption" color="textMuted" numberOfLines={1}>
      {text}
    </Text>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1, backgroundColor: t.colors.background },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  head: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.xs, gap: t.spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  colorDot: { width: 12, height: 12, borderRadius: t.radius.pill },
  title: {
    ...t.typography.title,
    flex: 1,
    color: t.colors.text,
    paddingVertical: t.spacing.sm,
  },
  // No side padding: the editor pads its own text, so the toolbar can run edge to edge.
  editor: { flex: 1, paddingTop: t.spacing.sm },
  photos: { paddingTop: t.spacing.sm },
}));
