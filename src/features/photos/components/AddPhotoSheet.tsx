import { ListGroup, ListRow, Sheet, Text } from '@/components/ui';
import { useDb } from '@/db';
import { useLock } from '@/features/lock';
import { run, showInfo } from '@/lib/errors';

import { pickFromLibrary, takePhoto, type PickedImage } from '../pick';
import { addPhotos } from '../photos';
import { importPhoto } from '../storage';

/** Camera or photo library. Picked photos are copied into the app, shrunk, and added to the note. */
export function AddPhotoSheet({ noteId, visible, onClose }: { noteId: string; visible: boolean; onClose: () => void }) {
  const db = useDb();
  const { suspendAutoLock } = useLock();

  const add = (pick: () => Promise<PickedImage[]>) => {
    onClose();
    run(
      (async () => {
        // The picker is another app for a moment: don't lock while it's open.
        const release = suspendAutoLock();
        let picked: PickedImage[];
        try {
          picked = await pick();
        } finally {
          release();
        }
        if (!picked.length) return;
        const imported = [];
        for (const image of picked) imported.push(await importPhoto(image));
        await addPhotos(db, noteId, imported);
        if (imported.length > 1) showInfo(`Added ${imported.length} photos.`);
      })(),
      'Could not add the photos.',
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="heading">Add photos</Text>
      <ListGroup>
        <ListRow icon="images-outline" title="Choose from your photos" onPress={() => add(pickFromLibrary)} />
        <ListRow icon="camera-outline" title="Take a photo" divider onPress={() => add(takePhoto)} />
      </ListGroup>
      <Text variant="caption" color="textMuted">
        Photos are copied into PB Notes and stay on this phone. Location details are removed.
      </Text>
    </Sheet>
  );
}
