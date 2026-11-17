import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Card, ListGroup, ListRow, Screen, Section, Text, Toggle } from '@/components/ui';
import { useDb } from '@/db';
import { useLive } from '@/db/useLive';
import { countLocked } from '@/features/library/library';
import { getBiometricSupport, relockOptions, useLock, type BiometricSupport } from '@/features/lock';
import { authenticateWithBiometrics } from '@/features/lock/biometrics';
import { plural } from '@/lib/dates';
import { run, showInfo } from '@/lib/errors';
import { createStyles, useTheme } from '@/theme';

export default function LockSettingsScreen() {
  const { config } = useLock();
  return <Screen safeTop={false}>{config ? <LockOn /> : <LockOff />}</Screen>;
}

function LockOff() {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <>
      <Card>
        <View style={styles.intro}>
          <View style={styles.badge}>
            <Ionicons name="lock-closed-outline" size={26} color={theme.colors.primary} />
          </View>
          <Text variant="heading" align="center">
            Keep your notes private
          </Text>
          <Text color="textMuted" align="center">
            Set a PIN or password. Use it to lock the whole app, or just the collections, books and notes
            you choose. You can add fingerprint or face unlock after.
          </Text>
        </View>
      </Card>
      <Button
        title="Set up a PIN"
        onPress={() => router.push({ pathname: '/settings/lock-setup', params: { mode: 'new', method: 'pin' } })}
      />
      <Button
        title="Use a password instead"
        variant="secondary"
        onPress={() => router.push({ pathname: '/settings/lock-setup', params: { mode: 'new', method: 'password' } })}
      />
      <Text variant="caption" color="textMuted" align="center">
        If you forget it, there is no way to recover it. Getting back in means clearing the app&apos;s data,
        which erases your notes, so keep a backup.
      </Text>
    </>
  );
}

function LockOn() {
  const db = useDb();
  const theme = useTheme();
  const { config, updateOptions, relockItems } = useLock();
  const [biometrics, setBiometrics] = useState<BiometricSupport | null>(null);
  const { data: lockedCount } = useLive(() => countLocked(db), ['collections', 'books', 'notes'], [db], 0);

  useEffect(() => {
    run(getBiometricSupport().then(setBiometrics), 'Could not check fingerprint or face unlock.');
  }, []);

  if (!config) return null;
  const isPin = config.method === 'pin';
  const other = isPin ? 'password' : 'pin';

  const toggleBiometrics = async (on: boolean) => {
    // Confirm the sensor works before relying on it.
    if (on && !(await authenticateWithBiometrics())) return;
    await updateOptions({ biometrics: on });
  };

  return (
    <>
      <Section
        title="What it locks"
        footer={`${plural(lockedCount, 'item')} locked. Lock a collection, book or note from its options menu.`}>
        <ListGroup>
          <ListRow
            icon="phone-portrait-outline"
            title="Lock the app"
            description="Ask every time PB Notes opens"
            right={
              <Toggle
                accessibilityLabel="Lock the app"
                value={config.lockOnOpen}
                onValueChange={(on) => run(updateOptions({ lockOnOpen: on }), 'Could not save the lock setting.')}
              />
            }
          />
          <ListRow
            icon="lock-closed-outline"
            title="Lock opened items now"
            description="Items you unlocked ask again"
            onPress={() => {
              relockItems();
              showInfo('Locked items are locked again.');
            }}
            divider
          />
        </ListGroup>
      </Section>

      <Section title="Unlock with">
        <ListGroup>
          <ListRow
            icon={isPin ? 'keypad-outline' : 'key-outline'}
            title={isPin ? 'Change PIN' : 'Change password'}
            onPress={() => router.push({ pathname: '/settings/lock-setup', params: { mode: 'change', method: config.method } })}
          />
          <ListRow
            icon={isPin ? 'key-outline' : 'keypad-outline'}
            title={isPin ? 'Switch to a password' : 'Switch to a PIN'}
            onPress={() => router.push({ pathname: '/settings/lock-setup', params: { mode: 'change', method: other } })}
            divider
          />
          {biometrics?.available ? (
            <ListRow
              icon="finger-print"
              title={biometrics.label}
              description={`Unlock with ${biometrics.label.toLowerCase()}, with your ${isPin ? 'PIN' : 'password'} as backup.`}
              right={
                <Toggle
                  accessibilityLabel={biometrics.label}
                  value={config.biometrics}
                  onValueChange={(on) => run(toggleBiometrics(on), 'Could not change fingerprint or face unlock.')}
                />
              }
              divider
            />
          ) : null}
        </ListGroup>
      </Section>

      <Section title="Lock again" footer="How long the app can be in the background before it, and anything you unlocked, asks again.">
        <ListGroup>
          {relockOptions.map((option, i) => (
            <ListRow
              key={option.value}
              title={option.label}
              onPress={() => run(updateOptions({ relockAfterMs: option.value }), 'Could not save the lock setting.')}
              right={
                config.relockAfterMs === option.value ? (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                ) : (
                  <View />
                )
              }
              divider={i > 0}
            />
          ))}
        </ListGroup>
      </Section>

      <Section footer={lockedCount ? `Turning it off also unlocks the ${plural(lockedCount, 'locked item')}.` : undefined}>
        <ListGroup>
          <ListRow
            icon="lock-open-outline"
            title={`Remove ${isPin ? 'PIN' : 'password'}`}
            destructive
            onPress={() => router.push({ pathname: '/settings/lock-setup', params: { mode: 'disable' } })}
          />
        </ListGroup>
      </Section>
    </>
  );
}

const useStyles = createStyles((t) => ({
  intro: { alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.sm },
  badge: {
    width: 56,
    height: 56,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing.xs,
  },
}));
