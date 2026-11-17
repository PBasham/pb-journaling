import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ErrorToast } from '@/components/ui';
import { DatabaseProvider } from '@/db';
import { useTheme } from '@/theme';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <App />
    </DatabaseProvider>
  );
}

function App() {
  const theme = useTheme();
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { color: theme.colors.text },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        {/* The title is never shown, but back buttons announce it ("Library, back"). */}
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Library' }} />
        <Stack.Screen name="collection/[id]" options={{ title: '' }} />
        <Stack.Screen name="book/[id]" options={{ title: '' }} />
        <Stack.Screen name="note/[id]" options={{ title: '' }} />
      </Stack>
      <ErrorToast />
    </ThemeProvider>
  );
}
