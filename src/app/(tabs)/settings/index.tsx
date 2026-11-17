import Constants from 'expo-constants';
import { router } from 'expo-router';

import { ListGroup, ListRow, Screen, Section, Text, Toggle } from '@/components/ui';
import { useLock } from '@/features/lock';
import { useSetting } from '@/features/settings/settings';
import { formatWhen } from '@/lib/dates';
import { accents, isAccentName } from '@/theme';

const appearanceLabels = { system: 'System', light: 'Light', dark: 'Dark' } as const;

export default function SettingsScreen() {
  const [appearance] = useSetting('appearance');
  const [accent] = useSetting('accent');
  const [showPreviews, setShowPreviews] = useSetting('showPreviews');
  const [lastBackupAt] = useSetting('lastBackupAt');
  const { config } = useLock();
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const accentLabel = accents[isAccentName(accent) ? accent : 'indigo'].label;
  const lockValue = !config ? 'Off' : config.method === 'pin' ? 'PIN' : 'Password';

  return (
    <Screen title="Settings">
      <Section title="Look and feel">
        <ListGroup>
          <ListRow
            icon="contrast-outline"
            title="Appearance"
            value={`${appearanceLabels[appearance]} · ${accentLabel}`}
            onPress={() => router.push('/settings/appearance')}
          />
          <ListRow
            icon="reader-outline"
            title="Note previews"
            description="Show the first lines of a note under its title"
            right={<Toggle accessibilityLabel="Note previews" value={showPreviews} onValueChange={setShowPreviews} />}
            divider
          />
        </ListGroup>
      </Section>

      <Section title="Privacy and data">
        <ListGroup>
          <ListRow
            icon="lock-closed-outline"
            title="Locks"
            description="PIN or password for the app, and for collections, books and notes you lock"
            value={lockValue}
            onPress={() => router.push('/settings/lock')}
          />
          <ListRow
            icon="cloud-upload-outline"
            title="Backup & restore"
            value={lastBackupAt ? `Last ${formatWhen(new Date(lastBackupAt))}` : 'Never'}
            onPress={() => router.push('/settings/backup')}
            divider
          />
        </ListGroup>
      </Section>

      <Text variant="caption" color="textMuted" align="center">
        PB Notes {version}. Your notes stay on this device.
      </Text>
    </Screen>
  );
}
