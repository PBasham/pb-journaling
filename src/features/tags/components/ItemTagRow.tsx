import { useState } from 'react';
import { ScrollView } from 'react-native';

import { createStyles } from '@/theme';

import type { ItemKind } from '../../library/library';
import { useItemTags } from '../queries';

import { TagChip } from './TagChip';
import { TagPickerSheet } from './TagPickerSheet';

/** A collection's, book's or note's tags as chips, with "Add tag". Tapping opens the tag picker. */
export function ItemTagRow({ kind, id }: { kind: ItemKind; id: string }) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const { data: tags } = useItemTags(kind, id);
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.row}>
        {tags.map((tag) => (
          <TagChip key={tag.id} name={tag.name} color={tag.color} onPress={() => setOpen(true)} />
        ))}
        <TagChip
          name={tags.length ? 'Edit' : 'Add tag'}
          add
          onPress={() => setOpen(true)}
          accessibilityLabel={tags.length ? 'Edit tags' : 'Add tag'}
        />
      </ScrollView>
      <TagPickerSheet kind={kind} id={id} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const useStyles = createStyles((t) => ({
  row: { gap: t.spacing.xs, paddingVertical: t.spacing.xs },
}));
