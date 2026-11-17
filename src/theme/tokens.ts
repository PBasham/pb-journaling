/**
 * Design tokens. Every color, size and spacing value in the app comes from here.
 * Screens and components never hardcode these values.
 */

const palette = {
  paper0: '#FFFDF9',
  paper50: '#F7F3EC',
  paper100: '#EEE8DE',
  paper200: '#E0D8CB',
  ink400: '#A39A8D',
  ink600: '#6B6358',
  ink900: '#2B2620',

  night950: '#141210',
  night900: '#1C1A17',
  night850: '#24211D',
  night800: '#332F2A',
  night100: '#F1ECE4',

  indigo50: '#ECEEFA',
  indigo400: '#9AA6F0',
  indigo500: '#6474D6',
  indigo600: '#4555B8',
  indigo700: '#374497',
  indigo900: '#20264A',

  red600: '#B8423C',
  red400: '#E58A84',
} as const;

const lightColorValues = {
  background: palette.paper50,
  surface: palette.paper0,
  surfaceMuted: palette.paper100,
  border: palette.paper200,

  text: palette.ink900,
  textMuted: palette.ink600,
  textInverse: palette.paper0,

  // indigo600 so text and white on buttons meet WCAG AA (4.5:1).
  primary: palette.indigo600,
  primaryPressed: palette.indigo700,
  primarySoft: palette.indigo50,
  onPrimary: palette.paper0,

  danger: palette.red600,
  shadow: '#000000',
  overlay: 'rgba(20, 18, 16, 0.5)',
  /** Full screen photo viewer: always black with white controls, like a photo app. */
  photoBackground: '#000000',
  onPhoto: '#FFFFFF',

  tabBar: palette.paper0,
  tabActive: palette.indigo600,
  tabInactive: palette.ink600,
};

export type ThemeColors = { [K in keyof typeof lightColorValues]: string };

export const lightColors: ThemeColors = lightColorValues;

export const darkColors: ThemeColors = {
  background: palette.night950,
  surface: palette.night900,
  surfaceMuted: palette.night850,
  border: palette.night800,

  text: palette.night100,
  textMuted: palette.ink400,
  textInverse: palette.ink900,

  primary: palette.indigo400,
  primaryPressed: palette.indigo500,
  primarySoft: palette.indigo900,
  onPrimary: palette.ink900,

  danger: palette.red400,
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  /** Full screen photo viewer: always black with white controls, like a photo app. */
  photoBackground: '#000000',
  onPhoto: '#FFFFFF',

  tabBar: palette.night900,
  tabActive: palette.indigo400,
  tabInactive: palette.ink400,
};

/**
 * Accent colors for buttons, links and highlights. Each keeps the contrast rules the default
 * indigo follows: the light primary works as text on the background and behind white text
 * (4.5:1 or better), the dark primary as text on the dark background and behind dark text.
 */
export const accents = {
  indigo: {
    label: 'Indigo',
    light: { primary: palette.indigo600, pressed: palette.indigo700, soft: palette.indigo50 },
    dark: { primary: palette.indigo400, pressed: palette.indigo500, soft: palette.indigo900 },
  },
  teal: {
    label: 'Teal',
    light: { primary: '#2F7570', pressed: '#245C58', soft: '#EAF5F4' },
    dark: { primary: '#6CC3BB', pressed: '#3F8F89', soft: '#173634' },
  },
  blue: {
    label: 'Blue',
    light: { primary: '#2F62B0', pressed: '#244E8E', soft: '#EAF0FB' },
    dark: { primary: '#8AB0F0', pressed: '#6890D0', soft: '#1A2840' },
  },
  purple: {
    label: 'Purple',
    light: { primary: '#6B4FA8', pressed: '#553E87', soft: '#F1EDF8' },
    dark: { primary: '#B79CE6', pressed: '#8E72C2', soft: '#2A2238' },
  },
  rose: {
    label: 'Rose',
    light: { primary: '#A8436B', pressed: '#8A3557', soft: '#F9EBF1' },
    dark: { primary: '#EB9BBB', pressed: '#C7779A', soft: '#3A1F2A' },
  },
  green: {
    label: 'Green',
    light: { primary: '#2F7A45', pressed: '#23603A', soft: '#EAF5EC' },
    dark: { primary: '#7FCB93', pressed: '#5BA872', soft: '#1A3322' },
  },
  amber: {
    label: 'Amber',
    light: { primary: '#94600F', pressed: '#7A4F0C', soft: '#FBF1E2' },
    dark: { primary: '#F0B85A', pressed: '#CF9840', soft: '#3A2C14' },
  },
} as const;

export type AccentName = keyof typeof accents;

export function isAccentName(value: unknown): value is AccentName {
  return typeof value === 'string' && value in accents;
}

/** The base colors for a scheme with an accent swapped in. */
export function colorsFor(scheme: 'light' | 'dark', accent: AccentName): ThemeColors {
  const base = scheme === 'dark' ? darkColors : lightColors;
  const a = (accents[accent] ?? accents.indigo)[scheme];
  return { ...base, primary: a.primary, primaryPressed: a.pressed, primarySoft: a.soft, tabActive: a.primary };
}

/**
 * Colors a person can give a collection, book or note. Stored by name, so the shades can change
 * without touching saved data. Each has a light and dark shade that reads on that scheme's surface.
 */
export const itemColors = {
  slate: { label: 'Slate', light: '#7A8291', dark: '#9AA3B2' },
  red: { label: 'Red', light: '#C8504A', dark: '#E98A84' },
  orange: { label: 'Orange', light: '#D2782F', dark: '#F0A46A' },
  amber: { label: 'Amber', light: '#C99A1E', dark: '#EBC15A' },
  green: { label: 'Green', light: '#4E9A55', dark: '#86C98C' },
  teal: { label: 'Teal', light: '#2F8C86', dark: '#6CC3BB' },
  blue: { label: 'Blue', light: '#3B6FC4', dark: '#8AB0F0' },
  indigo: { label: 'Indigo', light: '#5560C8', dark: '#9AA6F0' },
  purple: { label: 'Purple', light: '#8452B8', dark: '#B79CE6' },
  pink: { label: 'Pink', light: '#C24C86', dark: '#EB9BBB' },
  brown: { label: 'Brown', light: '#8A6447', dark: '#C49C7C' },
} as const;

export type ItemColor = keyof typeof itemColors;

export const itemColorNames = Object.keys(itemColors) as ItemColor[];

export function isItemColor(value: unknown): value is ItemColor {
  return typeof value === 'string' && value in itemColors;
}

/**
 * Highlighter color saved inside note documents. It's stored in the note, so it is one value that
 * reads on both light and dark backgrounds (a see-through yellow), never a theme color.
 */
export const highlightColor = 'rgba(250, 204, 21, 0.4)';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.6 },
} as const;

export type TypographyVariant = keyof typeof typography;
