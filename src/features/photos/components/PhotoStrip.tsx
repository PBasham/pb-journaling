import { Image } from 'expo-image';
import { Pressable, ScrollView } from 'react-native';

import type { NotePhoto } from '@/db/schema';
import { createStyles } from '@/theme';

import { photoUri } from '../storage';

/** A row of square thumbnails. Tap one to open it full screen. */
export function PhotoStrip({ photos, onOpen }: { photos: NotePhoto[]; onOpen: (index: number) => void }) {
  const styles = useStyles();
  if (!photos.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {photos.map((p, i) => (
        <Pressable
          key={p.id}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Photo ${i + 1} of ${photos.length}. Open`}
          onPress={() => onOpen(i)}
          style={({ pressed }) => [styles.thumb, pressed && styles.pressed]}>
          <Image source={{ uri: photoUri(p.fileName) }} style={styles.image} contentFit="cover" transition={120} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const useStyles = createStyles((t) => ({
  row: { gap: t.spacing.sm, paddingHorizontal: t.spacing.lg },
  thumb: { width: 84, height: 84, borderRadius: t.radius.md, overflow: 'hidden', backgroundColor: t.colors.surfaceMuted },
  image: { width: '100%', height: '100%' },
  pressed: { opacity: 0.8 },
}));
