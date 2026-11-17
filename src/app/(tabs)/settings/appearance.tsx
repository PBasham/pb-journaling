import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { Screen, Section, SegmentedControl, Text } from '@/components/ui';
import { useSetting } from '@/features/settings/settings';
import { accents, createStyles, useTheme, type AccentName, type AppearancePreference } from '@/theme';

const options: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const [appearance, setAppearance] = useSetting('appearance');
  const [accent, setAccent] = useSetting('accent');

  return (
    <Screen safeTop={false}>
      <Section title="Theme" footer="System follows your phone's light or dark mode setting.">
        <SegmentedControl options={options} value={appearance} onChange={setAppearance} />
      </Section>

      <Section title="Accent color" footer="Used for buttons, links and highlights. Collections, books and notes keep their own colors.">
        <View style={styles.swatches} accessibilityRole="radiogroup">
          {(Object.keys(accents) as AccentName[]).map((name) => {
            const selected = accent === name;
            const color = accents[name][theme.scheme].primary;
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityLabel={accents[name].label}
                aria-checked={selected}
                onPress={() => setAccent(name)}
                style={styles.choice}>
                <View style={[styles.ring, selected && { borderColor: color }]}>
                  <View style={[styles.swatch, { backgroundColor: color }]}>
                    {selected ? <Ionicons name="checkmark" size={20} color={theme.colors.onPrimary} /> : null}
                  </View>
                </View>
                <Text variant="caption" color={selected ? 'text' : 'textMuted'}>
                  {accents[name].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>
    </Screen>
  );
}

const useStyles = createStyles((t) => ({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.md },
  choice: { alignItems: 'center', gap: t.spacing.xs, width: 52 },
  ring: {
    padding: t.spacing.xxs,
    borderRadius: t.radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
