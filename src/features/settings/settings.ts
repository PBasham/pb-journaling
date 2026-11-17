import { useCallback } from 'react';

import { useDb } from '@/db';
import { useLive } from '@/db/useLive';
import { run } from '@/lib/errors';
import type { AccentName, AppearancePreference } from '@/theme';

import { getSetting, setSetting } from '../library/library';

/**
 * App settings stored in the `settings` table as JSON values.
 * Lock settings are NOT here: they live in secure storage (see `src/features/lock`).
 */
export interface Settings {
  appearance: AppearancePreference;
  /** Accent color for buttons, links and highlights. */
  accent: AccentName;
  /** Epoch ms of the last successful backup export. */
  lastBackupAt: number | null;
  /** Show the first lines of a note under its title in lists. */
  showPreviews: boolean;
}

export const defaultSettings: Settings = {
  appearance: 'system',
  accent: 'indigo',
  lastBackupAt: null,
  showPreviews: true,
};

export type SettingKey = keyof Settings;

const settingKey = (key: SettingKey) => `app.${key}`;

/** A setting's current value (live) and a setter. Until it loads, the value is the default. */
export function useSetting<K extends SettingKey>(key: K): [Settings[K], (value: Settings[K]) => void, boolean] {
  const db = useDb();
  const { data, loaded } = useLive(
    () => getSetting<Settings[K]>(db, settingKey(key), defaultSettings[key]),
    ['settings'],
    [db, key],
    defaultSettings[key],
  );
  const setValue = useCallback(
    (next: Settings[K]) => run(setSetting(db, settingKey(key), next), 'Could not save that setting.'),
    [db, key],
  );
  return [data, setValue, loaded];
}
