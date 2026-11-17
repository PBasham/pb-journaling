import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { IconButton, Screen, Text } from '@/components/ui';
import { useDb } from '@/db';
import type { Note } from '@/db/schema';
import { reorderPages } from '@/features/library/library';
import { useBook, usePages } from '@/features/library/queries';
import { ItemLockGate } from '@/features/lock';
import { run } from '@/lib/errors';
import { createStyles, spacing, useTheme } from '@/theme';

/** Every row is the same height, so a drag position maps straight to a slot. */
const ROW_HEIGHT = 60;
const SLOT = ROW_HEIGHT + spacing.sm;

type Positions = Record<string, number>;

const positionsOf = (ids: string[]): Positions => Object.fromEntries(ids.map((id, i) => [id, i]));

/** Drag pages by their handle, or use the arrows, to put a book's pages in order. Saves as you go. */
export default function ReorderPagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: book } = useBook(id);
  return (
    <ItemLockGate kind="book" id={id} name={book?.name}>
      <Reorder bookId={id} />
    </ItemLockGate>
  );
}

function Reorder({ bookId }: { bookId: string }) {
  const db = useDb();
  const styles = useStyles();
  const pages = usePages(bookId);
  const [order, setOrder] = useState<string[] | null>(null);
  const positions = useSharedValue<Positions>({});
  const active = useSharedValue<string | null>(null);

  // Start from the saved order once it loads; after that, the local order leads.
  const ids = order ?? pages.data.map((p) => p.id);
  const byId = new Map(pages.data.map((p) => [p.id, p]));
  const idsKey = ids.join(',');

  useEffect(() => {
    positions.set(positionsOf(idsKey ? idsKey.split(',') : []));
  }, [idsKey, positions]);

  const save = (next: string[]) => {
    setOrder(next);
    run(reorderPages(db, bookId, next), 'Could not save the page order.');
  };

  const commit = (finished: Positions) => {
    const next = Object.keys(finished).sort((a, b) => finished[a] - finished[b]);
    if (next.join(',') !== idsKey) save(next);
  };

  const shift = (index: number, step: -1 | 1) => {
    const target = index + step;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  };

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: 'Reorder pages' }} />
      <Text color="textMuted">Drag a page by its handle, or use the arrows. Changes save as you go.</Text>
      <View style={[styles.list, { height: ids.length * SLOT }]}>
        {ids.map((pageId, index) => {
          const page = byId.get(pageId);
          if (!page) return null;
          return (
            <Row
              key={pageId}
              page={page}
              index={index}
              count={ids.length}
              positions={positions}
              active={active}
              onDrop={commit}
              onShift={(step) => shift(index, step)}
            />
          );
        })}
      </View>
    </Screen>
  );
}

function Row({
  page,
  index,
  count,
  positions,
  active,
  onDrop,
  onShift,
}: {
  page: Note;
  index: number;
  count: number;
  positions: SharedValue<Positions>;
  active: SharedValue<string | null>;
  onDrop: (positions: Positions) => void;
  onShift: (step: -1 | 1) => void;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const id = page.id;
  const dragTop = useSharedValue(0);
  const startTop = useSharedValue(0);

  const pan = usePanGesture({
    onBegin: () => {
      'worklet';
      active.set(id);
      startTop.set((positions.get()[id] ?? 0) * SLOT);
      dragTop.set(startTop.get());
    },
    onUpdate: (e) => {
      'worklet';
      const max = (Object.keys(positions.get()).length - 1) * SLOT;
      dragTop.set(Math.min(Math.max(startTop.get() + e.translationY, 0), max));
      const from = positions.get()[id];
      const to = Math.round(dragTop.get() / SLOT);
      if (to === from) return;
      // Swap with whichever page sits in the slot being dragged over.
      const next: Positions = { ...positions.get() };
      for (const other of Object.keys(next)) {
        if (next[other] === to) next[other] = from;
      }
      next[id] = to;
      positions.set(next);
    },
    onFinalize: () => {
      'worklet';
      if (active.get() !== id) return;
      active.set(null);
      scheduleOnRN(onDrop, positions.get());
    },
  });

  const animated = useAnimatedStyle(() => {
    const dragging = active.get() === id;
    const top = (positions.get()[id] ?? 0) * SLOT;
    return {
      top: dragging ? dragTop.get() : withTiming(top, { duration: 160 }),
      zIndex: dragging ? 10 : 1,
      transform: [{ scale: withTiming(dragging ? 1.02 : 1, { duration: 120 }) }],
      shadowOpacity: withTiming(dragging ? 0.15 : 0, { duration: 120 }),
    };
  });

  return (
    <Animated.View style={[styles.row, animated]}>
      <GestureDetector gesture={pan}>
        <View style={styles.handle} accessibilityLabel="Drag to move" accessibilityHint="Or use the arrow buttons">
          <Ionicons name="reorder-three" size={26} color={theme.colors.textMuted} />
        </View>
      </GestureDetector>
      <Text variant="caption" color="textMuted">
        {index + 1}.
      </Text>
      <Text variant="bodyStrong" numberOfLines={1} color={page.title ? 'text' : 'textMuted'} style={styles.flex}>
        {page.title || 'Untitled'}
      </Text>
      <IconButton icon="chevron-up" label={`Move ${page.title || 'page'} up`} disabled={index === 0} onPress={() => onShift(-1)} />
      <IconButton
        icon="chevron-down"
        label={`Move ${page.title || 'page'} down`}
        disabled={index === count - 1}
        onPress={() => onShift(1)}
      />
    </Animated.View>
  );
}

const useStyles = createStyles((t) => ({
  list: { position: 'relative' },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingRight: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    shadowColor: t.colors.shadow,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  handle: { height: '100%', justifyContent: 'center', paddingHorizontal: t.spacing.md },
  flex: { flex: 1 },
}));
