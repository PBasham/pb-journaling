import { TextInput, View, type TextInputProps } from 'react-native';

import { createStyles, useTheme } from '@/theme';

import { Text } from './Text';

interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Helper or error text under the field. */
  hint?: string;
  error?: boolean;
}

export function TextField({ label, hint, error, style, ...rest }: TextFieldProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="label" color="textMuted" uppercase>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        style={[styles.input, error && styles.inputError, style]}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...rest}
      />
      {hint ? (
        <Text variant="caption" color={error ? 'danger' : 'textMuted'}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  container: {
    gap: t.spacing.xs,
  },
  input: {
    ...t.typography.body,
    color: t.colors.text,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.md,
  },
  inputError: {
    borderColor: t.colors.danger,
  },
}));
