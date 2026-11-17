import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorToast } from '@/components/ui';
import { DatabaseProvider } from '@/db';
import { LockGate, LockProvider } from '@/features/lock';
import { AppearanceProvider } from '@/features/settings/AppearanceProvider';
import { useTheme } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <DatabaseProvider>
        <AppearanceProvider>
          <LockProvider>
            <App />
          </LockProvider>
        </AppearanceProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
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
      <LockGate>
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
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Library' }} />
          <Stack.Screen name="collection/[id]" options={{ title: '' }} />
          <Stack.Screen name="book/[id]" options={{ title: '' }} />
          <Stack.Screen name="book/reorder" options={{ title: 'Reorder pages' }} />
          <Stack.Screen name="note/[id]" options={{ title: '' }} />
        </Stack>
      </LockGate>
      <ErrorToast />
    </ThemeProvider>
  );
}
