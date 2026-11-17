import { Switch, type SwitchProps } from 'react-native';

import { useTheme } from '@/theme';

/** Themed on/off switch. */
export function Toggle(props: SwitchProps) {
  const theme = useTheme();
  return (
    <Switch
      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
      thumbColor={theme.colors.surface}
      ios_backgroundColor={theme.colors.border}
      {...props}
    />
  );
}
