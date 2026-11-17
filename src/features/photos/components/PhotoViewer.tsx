import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { FlatList, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDialog, Text } from '@/components/ui';
import type { NotePhoto } from '@/db/schema';
import { useContentHidden } from '@/features/lock/LockProvider';
import { createStyles, useTheme } from '@/theme';

import { photoUri } from '../storage';

interface PhotoViewerProps {
  photos: NotePhoto[];
  /** Photo to open at, or null when closed. */
  index: number | null;
  onClose: () => void;
  onDelete: (photo: NotePhoto) => void;
}

/**
 * Full screen photos, swipe between them. Hidden while the app is locked.
 * Give it a `key` of the opening index so it starts on the right photo each time.
 */
export function PhotoViewer({ photos, index, onClose, onDelete }: PhotoViewerProps) {
  const styles = useStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const hidden = useContentHidden();
  const [current, setCurrent] = useState(index ?? 0);
  const [confirming, setConfirming] = useState(false);
  const list = useRef<FlatList<NotePhoto>>(null);

  const photo = photos[Math.min(current, photos.length - 1)];
  const visible = index !== null && !hidden && photos.length > 0;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.screen}>
        <FlatList
          ref={list}
          data={photos}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index: i }) => (
            <View style={{ width, height }} accessible accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}>
              <Image source={{ uri: photoUri(item.fileName) }} style={styles.image} contentFit="contain" />
            </View>
          )}
        />
        <View style={[styles.bar, { paddingTop: insets.top + theme.spacing.sm }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={styles.button}>
            <Ionicons name="close" size={26} color={theme.colors.onPhoto} />
          </Pressable>
          <Text style={styles.count}>
            {Math.min(current, photos.length - 1) + 1} / {photos.length}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove this photo"
            onPress={() => setConfirming(true)}
            hitSlop={10}
            style={styles.button}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.onPhoto} />
          </Pressable>
        </View>
      </View>
      <ConfirmDialog
        visible={confirming}
        title="Remove this photo?"
        message="It's removed from this note. The original in your gallery isn't touched."
        confirmLabel="Remove"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          if (photo) onDelete(photo);
          if (photos.length <= 1) onClose();
          else setCurrent((c) => Math.max(0, Math.min(c, photos.length - 2)));
        }}
      />
    </Modal>
  );
}

const useStyles = createStyles((t) => ({
  // The viewer is always dark, like a photo app, in both themes.
  screen: { flex: 1, backgroundColor: t.colors.photoBackground },
  image: { width: '100%', height: '100%' },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.sm,
  },
  button: { padding: t.spacing.xs },
  count: { color: t.colors.onPhoto },
}));
