import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function SettingsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Settings' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="lock" options={{ title: 'Locks' }} />
      <Stack.Screen name="lock-setup" options={{ title: '' }} />
      <Stack.Screen name="backup" options={{ title: 'Backup & restore' }} />
      <Stack.Screen name="trash" options={{ title: 'Recently deleted' }} />
      <Stack.Screen name="tags" options={{ title: 'Tags' }} />
      <Stack.Screen name="templates" options={{ title: 'Templates' }} />
      <Stack.Screen name="developer" options={{ title: 'Developer tools' }} />
    </Stack>
  );
}
