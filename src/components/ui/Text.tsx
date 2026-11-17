import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  /** A theme color name. Defaults to `text`. */
  color?: keyof ThemeColors;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
}

export function Text({
  variant = 'body',
  color = 'text',
  align,
  uppercase,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        align && { textAlign: align },
        uppercase && { textTransform: 'uppercase' },
        style,
      ]}
      {...rest}
    />
  );
}
