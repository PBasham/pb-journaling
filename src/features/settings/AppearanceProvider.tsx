import { useMemo, type PropsWithChildren } from 'react';

import { AppearanceContext, isAccentName } from '@/theme';

import { useSetting } from './settings';

/** Feeds the saved appearance and accent into the theme. Must sit inside `DatabaseProvider`. */
export function AppearanceProvider({ children }: PropsWithChildren) {
  const [appearance] = useSetting('appearance');
  const [accent] = useSetting('accent');
  const value = useMemo(
    () => ({ appearance, accent: isAccentName(accent) ? accent : ('indigo' as const) }),
    [appearance, accent],
  );
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}
