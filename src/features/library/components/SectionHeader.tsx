import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ListGroup, ListRow, SegmentedControl, Sheet, Text } from '@/components/ui';
import { createStyles, useTheme } from '@/theme';

import type { SortField, SortOrder } from '../library';

const fieldLabels: Record<SortField, string> = { updated: 'Updated', created: 'Created', name: 'Name' };

interface SectionHeaderProps {
  title: string;
  sort?: SortOrder;
  onSortChange?: (sort: SortOrder) => void;
}

/** A section title with an optional sort control on the right. */
export function SectionHeader({ title, sort, onSortChange }: SectionHeaderProps) {
  const styles = useStyles();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.row}>
      <Text variant="label" color="textMuted" uppercase style={styles.flex} accessibilityRole="header">
        {title}
      </Text>
      {sort && onSortChange ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sort ${title}: ${fieldLabels[sort.field]}, ${directionLabel(sort)}`}
            onPress={() => setOpen(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}>
            <Text variant="caption" color="primary">
              {fieldLabels[sort.field]}
            </Text>
            <Ionicons name={sort.ascending ? 'arrow-up' : 'arrow-down'} size={14} color={theme.colors.primary} />
          </Pressable>
          <Sheet visible={open} onClose={() => setOpen(false)}>
            <Text variant="heading">Sort {title.toLowerCase()}</Text>
            <ListGroup>
              {(Object.keys(fieldLabels) as SortField[]).map((field, i) => (
                <ListRow
                  key={field}
                  title={fieldLabels[field]}
                  divider={i > 0}
                  onPress={() => onSortChange({ field, ascending: field === 'name' })}
                  right={
                    sort.field === field ? (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    ) : (
                      <View />
                    )
                  }
                />
              ))}
            </ListGroup>
            <SegmentedControl
              options={[
                { value: 'asc', label: sort.field === 'name' ? 'A to Z' : 'Oldest first' },
                { value: 'desc', label: sort.field === 'name' ? 'Z to A' : 'Newest first' },
              ]}
              value={sort.ascending ? 'asc' : 'desc'}
              onChange={(v) => onSortChange({ ...sort, ascending: v === 'asc' })}
            />
          </Sheet>
        </>
      ) : null}
    </View>
  );
}

function directionLabel(sort: SortOrder) {
  if (sort.field === 'name') return sort.ascending ? 'A to Z' : 'Z to A';
  return sort.ascending ? 'oldest first' : 'newest first';
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.spacing.xs, marginTop: t.spacing.sm },
  flex: { flex: 1 },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs },
  pressed: { opacity: 0.6 },
}));
