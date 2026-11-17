import {
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  darkColors,
  itemColors,
  lightColors,
  radius,
  spacing,
  typography,
  type ItemColor,
  type ThemeColors,
} from './tokens';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

const themes: Record<ColorScheme, Theme> = {
  light: { scheme: 'light', colors: lightColors, spacing, radius, typography },
  dark: { scheme: 'dark', colors: darkColors, spacing, radius, typography },
};

/** Current theme, following the system light or dark setting. */
export function useTheme(): Theme {
  return themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

/** The shade of an item color for the current scheme. Unknown or missing names fall back to slate. */
export function itemColorValue(theme: Theme, color: string | null | undefined): string {
  const entry = itemColors[(color ?? 'slate') as ItemColor] ?? itemColors.slate;
  return entry[theme.scheme];
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Defines themed styles outside of components. Styles are built once per color scheme and cached,
 * so components never recreate them on render.
 *
 * @example
 * const useStyles = createStyles((t) => ({ card: { backgroundColor: t.colors.surface } }));
 * function Card() { const styles = useStyles(); ... }
 */
export function createStyles<T extends NamedStyles<T>>(
  factory: (theme: Theme) => T & NamedStyles<any>,
) {
  const cache = new Map<ColorScheme, T>();
  return function useStyles(): T {
    const theme = useTheme();
    const cached = cache.get(theme.scheme);
    if (cached) return cached;
    const styles = StyleSheet.create(factory(theme)) as T;
    cache.set(theme.scheme, styles);
    return styles;
  };
}

export { isItemColor, itemColorNames, itemColors, radius, spacing, typography } from './tokens';
export type { ItemColor, ThemeColors, TypographyVariant } from './tokens';
