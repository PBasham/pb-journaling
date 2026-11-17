import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';

/**
 * Runs a query and runs it again whenever any of the named tables change.
 * Drizzle's `useLiveQuery` only watches the table a query selects from, which misses counts and
 * joins; this watches every table the result depends on.
 *
 * `run` must be stable for the given `deps` (rebuild it inside the component from the deps).
 */
export function useLive<T>(
  run: () => Promise<T>,
  tables: string[],
  deps: unknown[],
  initial: T,
): { data: T; loaded: boolean } {
  const [state, setState] = useState<{ data: T; loaded: boolean }>({ data: initial, loaded: false });
  const tableKey = tables.join(',');

  useEffect(() => {
    let active = true;
    // Answers can arrive out of order; only the newest request may set state.
    let latest = 0;
    const load = () => {
      const request = ++latest;
      run()
        .then((data) => {
          if (active && request === latest) setState({ data, loaded: true });
        })
        .catch((error: unknown) => console.error('Live query failed', error));
    };
    load();
    const watched = new Set(tableKey.split(','));
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (watched.has(tableName)) load();
    });
    return () => {
      active = false;
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, ...deps]);

  return state;
}
