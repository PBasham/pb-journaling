import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ConfirmDialog, ListGroup, ListRow, Sheet, Text } from '@/components/ui';
import { router } from 'expo-router';

import { useDb } from '@/db';
import { useLock } from '@/features/lock';
import type { Book, Collection, Note } from '@/db/schema';
import { run, showInfo, showUndo } from '@/lib/errors';
import { createStyles, isItemColor, itemColorValue, useTheme, type ItemColor } from '@/theme';

import {
  deleteBook,
  deleteCollection,
  deleteNote,
  moveBook,
  moveNote,
  restoreDeleted,
  shiftPage,
  updateBook,
  updateCollection,
  updateNote,
  type CollectionDeleteMode,
  type NotePlace,
} from '../library';
import { useDestinations } from '../queries';

import { ItemFormSheet } from './ItemFormSheet';

export type ActionTarget =
  | { kind: 'collection'; item: Collection }
  | { kind: 'book'; item: Book }
  | { kind: 'note'; item: Note };

interface ItemActionsProps {
  target: ActionTarget | null;
  onClose: () => void;
  /** After a delete, so a screen showing the item can go back. */
  onDeleted?: (kind: ActionTarget['kind']) => void;
}

type Step = 'menu' | 'edit' | 'move' | 'delete';

/** Options for a collection, book or note: edit, favorite, move, reorder and delete. */
export function ItemActions({ target, onClose, onDeleted }: ItemActionsProps) {
  const [step, setStep] = useState<Step>('menu');
  const close = () => {
    setStep('menu');
    onClose();
  };
  if (!target) return null;
  return (
    <>
      <Menu target={target} visible={step === 'menu'} onStep={setStep} onClose={close} />
      <EditSheet target={target} visible={step === 'edit'} onClose={close} />
      <MoveSheet target={target} visible={step === 'move'} onClose={close} />
      <DeleteSheet target={target} visible={step === 'delete'} onClose={close} onDeleted={onDeleted} />
    </>
  );
}

function label(target: ActionTarget): string {
  if (target.kind === 'note') return target.item.title || 'Untitled';
  return target.item.name;
}

function Menu({
  target,
  visible,
  onStep,
  onClose,
}: {
  target: ActionTarget;
  visible: boolean;
  onStep: (step: Step) => void;
  onClose: () => void;
}) {
  const db = useDb();
  const { config, isUnlocked, keepOpen } = useLock();
  const { kind, item } = target;
  const isPage = kind === 'note' && !!item.bookId;
  // A locked item shows no options until it has been opened with the PIN or password.
  const sealed = item.isLocked && !!config && !isUnlocked([item.id]);

  const open = () => {
    onClose();
    if (kind === 'collection') router.push({ pathname: '/collection/[id]', params: { id: item.id } });
    else if (kind === 'book') router.push({ pathname: '/book/[id]', params: { id: item.id } });
    else router.push({ pathname: '/note/[id]', params: { id: item.id } });
  };

  const toggleLock = () => {
    onClose();
    if (!config) {
      showInfo('Set a PIN or password first. Then you can lock collections, books and notes.');
      router.push('/settings/lock');
      return;
    }
    const isLocked = !item.isLocked;
    // Whoever locks it is already in: keep it open until the app locks again.
    if (isLocked) keepOpen([item.id]);
    const save =
      kind === 'collection'
        ? updateCollection(db, item.id, { isLocked })
        : kind === 'book'
          ? updateBook(db, item.id, { isLocked })
          : updateNote(db, item.id, { isLocked });
    run(
      save.then(() => showInfo(isLocked ? 'Locked. It will ask for your PIN or password next time.' : 'Lock removed.')),
      'Could not change the lock.',
    );
  };

  if (sealed) {
    return (
      <Sheet visible={visible} onClose={onClose}>
        <Text variant="heading" numberOfLines={1}>
          {label(target)}
        </Text>
        <Text color="textMuted">This is locked. Open it with your PIN or password to see its options.</Text>
        <ListGroup>
          <ListRow icon="lock-open-outline" title="Open" onPress={open} />
        </ListGroup>
      </Sheet>
    );
  }

  const toggleFavorite = () => {
    const isFavorite = !item.isFavorite;
    const save =
      kind === 'collection'
        ? updateCollection(db, item.id, { isFavorite })
        : kind === 'book'
          ? updateBook(db, item.id, { isFavorite })
          : updateNote(db, item.id, { isFavorite });
    run(save, 'Could not change the favorite.');
    onClose();
  };

  const togglePin = () => {
    const isPinned = !item.isPinned;
    const save =
      kind === 'collection'
        ? updateCollection(db, item.id, { isPinned })
        : kind === 'book'
          ? updateBook(db, item.id, { isPinned })
          : updateNote(db, item.id, { isPinned });
    run(save, 'Could not change the pin.');
    onClose();
  };

  const shift = (step: -1 | 1) => {
    run(shiftPage(db, item.id, step), 'Could not move the page.');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="heading" numberOfLines={1}>
        {label(target)}
      </Text>
      <ListGroup>
        <ListRow
          icon="color-palette-outline"
          title={kind === 'note' ? 'Change color' : 'Rename and recolor'}
          onPress={() => onStep('edit')}
        />
        <ListRow
          icon={item.isFavorite ? 'star' : 'star-outline'}
          title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          divider
          onPress={toggleFavorite}
        />
        {!isPage ? (
          <ListRow
            icon={item.isPinned ? 'pin' : 'pin-outline'}
            title={item.isPinned ? 'Unpin' : 'Pin to top'}
            divider
            onPress={togglePin}
          />
        ) : null}
        {kind !== 'collection' ? (
          <ListRow icon="folder-open-outline" title="Move to…" divider onPress={() => onStep('move')} />
        ) : null}
        {isPage ? (
          <>
            <ListRow icon="arrow-up" title="Move page up" divider onPress={() => shift(-1)} />
            <ListRow icon="arrow-down" title="Move page down" divider onPress={() => shift(1)} />
          </>
        ) : null}
        <ListRow
          icon={item.isLocked ? 'lock-open-outline' : 'lock-closed-outline'}
          title={item.isLocked ? 'Remove lock' : 'Lock'}
          description={item.isLocked ? undefined : kind === 'note' ? 'Ask for your PIN or password to open it' : 'Locks everything inside too'}
          divider
          onPress={toggleLock}
        />
        <ListRow icon="trash-outline" title="Delete" destructive divider onPress={() => onStep('delete')} />
      </ListGroup>
    </Sheet>
  );
}

function EditSheet({ target, visible, onClose }: { target: ActionTarget; visible: boolean; onClose: () => void }) {
  const db = useDb();
  const { kind, item } = target;
  const color: ItemColor = isItemColor(item.color) ? item.color : 'slate';
  return (
    <ItemFormSheet
      visible={visible}
      title={kind === 'collection' ? 'Edit collection' : kind === 'book' ? 'Edit book' : 'Note color'}
      showName={kind !== 'note'}
      initialName={kind === 'note' ? '' : item.name}
      initialColor={color}
      saveLabel="Save"
      onClose={onClose}
      onSave={({ name, color: next }) => {
        const save =
          kind === 'collection'
            ? updateCollection(db, item.id, { name, color: next })
            : kind === 'book'
              ? updateBook(db, item.id, { name, color: next })
              : updateNote(db, item.id, { color: next });
        run(save, 'Could not save the changes.');
        onClose();
      }}
    />
  );
}

function MoveSheet({ target, visible, onClose }: { target: ActionTarget; visible: boolean; onClose: () => void }) {
  const db = useDb();
  const theme = useTheme();
  const styles = useStyles();
  const { data } = useDestinations();
  if (target.kind === 'collection') return null;
  const { kind, item } = target;
  const currentBook = kind === 'note' ? item.bookId : null;
  const currentCollection = item.collectionId;

  const move = (place: NotePlace, where: string) => {
    const save =
      kind === 'book'
        ? moveBook(db, item.id, place.bookId ? null : (place.collectionId ?? null))
        : moveNote(db, item.id, place);
    run(
      save.then(() => showInfo(`Moved to ${where}.`)),
      'Could not move it.',
    );
    onClose();
  };

  const check = <Ionicons name="checkmark" size={20} color={theme.colors.primary} />;
  const atTop = !currentBook && !currentCollection;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="heading">Move to</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        <ListGroup>
          <ListRow
            icon="home-outline"
            title="Library (top level)"
            right={atTop ? check : undefined}
            onPress={atTop ? undefined : () => move({ collectionId: null }, 'the library')}
          />
          {data.collections.map((c) => {
            const here = !currentBook && currentCollection === c.id;
            return (
              <ListRow
                key={c.id}
                icon="albums-outline"
                title={c.name}
                divider
                right={here ? check : <Dot color={itemColorValue(theme, c.color)} />}
                onPress={here ? undefined : () => move({ collectionId: c.id }, c.name)}
              />
            );
          })}
        </ListGroup>
        {kind === 'note' && data.books.length ? (
          <>
            <Text variant="label" color="textMuted" uppercase>
              Into a book, as its last page
            </Text>
            <ListGroup>
              {data.books.map((b, i) => {
                const here = currentBook === b.id;
                return (
                  <ListRow
                    key={b.id}
                    icon="book-outline"
                    title={b.name}
                    divider={i > 0}
                    right={here ? check : <Dot color={itemColorValue(theme, b.color)} />}
                    onPress={here ? undefined : () => move({ bookId: b.id }, b.name)}
                  />
                );
              })}
            </ListGroup>
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

function Dot({ color }: { color: string }) {
  const styles = useStyles();
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

function DeleteSheet({
  target,
  visible,
  onClose,
  onDeleted,
}: {
  target: ActionTarget;
  visible: boolean;
  onClose: () => void;
  onDeleted?: (kind: ActionTarget['kind']) => void;
}) {
  const db = useDb();
  const styles = useStyles();
  const name = label(target);
  const { kind, item } = target;

  /** Moves it to Recently deleted, with Undo for a few seconds. */
  const remove = (work: () => Promise<void>, message: string) => {
    onClose();
    run(
      work().then(() => {
        showUndo(message, () => restoreDeleted(db, kind, item.id));
        onDeleted?.(kind);
      }),
      'Could not delete it.',
    );
  };

  if (kind === 'collection') {
    const del = (mode: CollectionDeleteMode) => remove(() => deleteCollection(db, item.id, mode), `Deleted ${name}.`);
    return (
      <Sheet visible={visible} onClose={onClose}>
        <Text variant="heading">Delete “{name}”?</Text>
        <Text color="textMuted">
          Keep what&apos;s inside (its books and notes move to the top of your library) or delete everything. Deleted
          items stay in Recently deleted for 30 days.
        </Text>
        <View style={styles.list}>
          <Button title="Delete collection, keep contents" variant="secondary" onPress={() => del('keepContents')} />
          <Button title="Delete everything inside" variant="danger" onPress={() => del('everything')} />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </Sheet>
    );
  }

  if (kind === 'book') {
    return (
      <ConfirmDialog
        visible={visible}
        title={`Delete “${name}”?`}
        message="The book and its pages move to Recently deleted. You can restore them for 30 days."
        confirmLabel="Delete"
        destructive
        onCancel={onClose}
        onConfirm={() => remove(() => deleteBook(db, item.id), `Deleted ${name}.`)}
      />
    );
  }

  const isPage = !!item.bookId;
  return (
    <ConfirmDialog
      visible={visible}
      title={`Delete this ${isPage ? 'page' : 'note'}?`}
      message="It moves to Recently deleted. You can restore it for 30 days."
      confirmLabel="Delete"
      destructive
      onCancel={onClose}
      onConfirm={() => remove(() => deleteNote(db, item.id), isPage ? 'Page deleted.' : 'Note deleted.')}
    />
  );
}

const useStyles = createStyles((t) => ({
  list: { gap: t.spacing.sm },
  scroll: { maxHeight: 440 },
  dot: { width: 12, height: 12, borderRadius: t.radius.pill },
}));
