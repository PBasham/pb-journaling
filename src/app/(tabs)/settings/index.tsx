import Constants from 'expo-constants';
import { router } from 'expo-router';

import { ListGroup, ListRow, Screen, Section, Text, Toggle } from '@/components/ui';
import { useTrash } from '@/features/library/queries';
import { useLock } from '@/features/lock';
import { useSetting } from '@/features/settings/settings';
import { useTagsWithCounts } from '@/features/tags/queries';
import { useTemplates } from '@/features/templates/queries';
import { devToolsEnabled } from '@/lib/devTools';
import { formatWhen } from '@/lib/dates';
import { accents, isAccentName } from '@/theme';

const appearanceLabels = { system: 'System', light: 'Light', dark: 'Dark' } as const;

export default function SettingsScreen() {
  const [appearance] = useSetting('appearance');
  const [accent] = useSetting('accent');
  const [showPreviews, setShowPreviews] = useSetting('showPreviews');
  const [lastBackupAt] = useSetting('lastBackupAt');
  const { config } = useLock();
  const { data: trash } = useTrash();
  const { data: tags } = useTagsWithCounts();
  const { data: templates } = useTemplates();
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

      <Section title="Organize">
        <ListGroup>
          <ListRow
            icon="pricetags-outline"
            title="Tags"
            value={tags.length ? String(tags.length) : undefined}
            onPress={() => router.push('/settings/tags')}
          />
          <ListRow
            icon="document-text-outline"
            title="Templates"
            value={String(templates.length)}
            onPress={() => router.push('/settings/templates')}
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
            icon="trash-outline"
            title="Recently deleted"
            description="Restore anything deleted in the last 30 days"
            value={trash.length ? String(trash.length) : undefined}
            onPress={() => router.push('/settings/trash')}
            divider
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

      {devToolsEnabled ? (
        <Section title="Testing">
          <ListGroup>
            <ListRow
              icon="construct-outline"
              title="Developer tools"
              description="Sample data, test data and resets"
              onPress={() => router.push('/settings/developer')}
            />
          </ListGroup>
        </Section>
      ) : null}

      <Text variant="caption" color="textMuted" align="center">
        PB Notes {version}. Your notes stay on this device.
      </Text>
    </Screen>
  );
}
