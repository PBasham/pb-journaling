import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useMemo, useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { createStyles } from '@/theme';

import migrations from '../../drizzle/migrations';

import { purgeOldTrash } from '@/features/library/library';

import * as schema from './schema';

export const DATABASE_NAME = 'pb-notes.db';

export type Database = ExpoSQLiteDatabase<typeof schema>;

const openOptions = { enableChangeListener: true };

/**
 * Opens the database and runs migrations before any screen renders.
 * If that fails, shows a message with a retry button instead of a blank app.
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  if (error) {
    return (
      <OpenFailed
        error={error}
        onRetry={() => {
          setError(null);
          setAttempt((a) => a + 1);
        }}
      />
    );
  }

  return (
    <SQLiteProvider
      key={attempt}
      databaseName={DATABASE_NAME}
      options={openOptions}
      onInit={initializeDatabase}
      onError={(e) => {
        console.error('Database failed to open', e);
        setError(e);
      }}>
      {children}
    </SQLiteProvider>
  );
}

/** Typed Drizzle client for the open database. */
export function useDb(): Database {
  const sqlite = useSQLiteContext();
  return useMemo(() => drizzle(sqlite, { schema }), [sqlite]);
}

async function initializeDatabase(sqlite: SQLiteDatabase) {
  // Connection settings must be applied outside a transaction.
  await sqlite.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const db = drizzle(sqlite, { schema });
  await migrate(db, migrations);
  // Anything in Recently deleted for more than 30 days is removed for good.
  await purgeOldTrash(db);
}

function OpenFailed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text variant="title" align="center">
        Your notes couldn&apos;t open
      </Text>
      <Text color="textMuted" align="center">
        Something went wrong opening your data. Trying again often works.
      </Text>
      <Text variant="caption" color="textMuted" align="center">
        {String(error)}
      </Text>
      <Button title="Try again" onPress={onRetry} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: t.spacing.xl,
    gap: t.spacing.lg,
    backgroundColor: t.colors.background,
  },
}));
