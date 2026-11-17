import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/** Most photos added at once. Each one is copied and shrunk, so keep the wait short. */
export const PICK_LIMIT = 10;

/**
 * Android's photo picker: no storage permission needed, and the app only ever sees the photos
 * the user picks. Returns [] if cancelled.
 */
export async function pickFromLibrary(): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: PICK_LIMIT,
    quality: 1,
    exif: false,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

/** Opens the camera. Returns [] if cancelled; throws if the camera permission is refused. */
export async function takePhoto(): Promise<PickedImage[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera access is off. You can turn it on in your phone settings for PB Notes.');
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, exif: false });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}
