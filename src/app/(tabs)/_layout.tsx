import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/tabs';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; icon: IconName; iconFocused: IconName }[] = [
  { name: 'index', title: 'Library', icon: 'library-outline', iconFocused: 'library' },
  { name: 'search', title: 'Search', icon: 'search-outline', iconFocused: 'search' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
];

const TAB_BAR_HEIGHT = 70;

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: theme.spacing.xs + theme.spacing.xxs,
          paddingBottom: insets.bottom + theme.spacing.sm,
        },
        tabBarLabelStyle: { fontSize: theme.typography.label.fontSize, lineHeight: theme.typography.label.lineHeight, fontWeight: theme.typography.label.fontWeight },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={focused ? theme.colors.tabActive : theme.colors.tabInactive}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
