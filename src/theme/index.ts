import { createContext, useContext } from 'react';
import {
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  colorsFor,
  itemColors,
  radius,
  spacing,
  typography,
  type AccentName,
  type ItemColor,
  type ThemeColors,
} from './tokens';

export type ColorScheme = 'light' | 'dark';
export type AppearancePreference = 'system' | ColorScheme;

export interface Theme {
  scheme: ColorScheme;
  accent: AccentName;
  /** Changes whenever the colors do; styles are cached by it. */
  key: string;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

const themes = new Map<string, Theme>();

function themeFor(scheme: ColorScheme, accent: AccentName): Theme {
  const key = `${scheme}:${accent}`;
  let theme = themes.get(key);
  if (!theme) {
    theme = { scheme, accent, key, colors: colorsFor(scheme, accent), spacing, radius, typography };
    themes.set(key, theme);
  }
  return theme;
}

/** The person's appearance choices. Provided near the root from saved settings. */
export const AppearanceContext = createContext<{ appearance: AppearancePreference; accent: AccentName }>({
  appearance: 'system',
  accent: 'indigo',
});

/** Current theme: the saved appearance and accent, with the phone's setting when set to `system`. */
export function useTheme(): Theme {
  const { appearance, accent } = useContext(AppearanceContext);
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  return themeFor(appearance === 'system' ? system : appearance, accent);
}

/** The shade of an item color for the current scheme. Unknown or missing names fall back to slate. */
export function itemColorValue(theme: Theme, color: string | null | undefined): string {
  const entry = itemColors[(color ?? 'slate') as ItemColor] ?? itemColors.slate;
  return entry[theme.scheme];
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Defines themed styles outside of components. Styles are built once per theme and cached,
 * so components never recreate them on render.
 *
 * @example
 * const useStyles = createStyles((t) => ({ card: { backgroundColor: t.colors.surface } }));
 * function Card() { const styles = useStyles(); ... }
 */
export function createStyles<T extends NamedStyles<T>>(
  factory: (theme: Theme) => T & NamedStyles<any>,
) {
  const cache = new Map<string, T>();
  return function useStyles(): T {
    const theme = useTheme();
    const cached = cache.get(theme.key);
    if (cached) return cached;
    const styles = StyleSheet.create(factory(theme)) as T;
    cache.set(theme.key, styles);
    return styles;
  };
}

export { accents, isAccentName, isItemColor, itemColorNames, itemColors, radius, spacing, typography } from './tokens';
export type { AccentName, ItemColor, ThemeColors, TypographyVariant } from './tokens';
