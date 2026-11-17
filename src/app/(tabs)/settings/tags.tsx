import { useState } from 'react';

import { Button, ColorPicker, ConfirmDialog, EmptyState, ListGroup, ListRow, Screen, Sheet, Text, TextField } from '@/components/ui';
import { useDb } from '@/db';
import type { Tag } from '@/db/schema';
import { useTagsWithCounts } from '@/features/tags/queries';
import { deleteTag, updateTag } from '@/features/tags/tags';
import { plural } from '@/lib/dates';
import { run } from '@/lib/errors';
import { isItemColor, type ItemColor } from '@/theme';

export default function TagsScreen() {
  const db = useDb();
  const { data: tags, loaded } = useTagsWithCounts();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<ItemColor>('slate');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const open = (tag: Tag) => {
    setName(tag.name);
    setColor(isItemColor(tag.color) ? tag.color : 'slate');
    setEditing(tag);
  };

  return (
    <Screen safeTop={false}>
      {loaded && !tags.length ? (
        <EmptyState icon="pricetags-outline" title="No tags yet" message="Add tags from a note's options, or the tag row under its title." />
      ) : null}
      {tags.length ? (
        <ListGroup>
          {tags.map((tag, i) => (
            <ListRow
              key={tag.id}
              icon="pricetag-outline"
              title={`#${tag.name}`}
              value={plural(tag.count, 'note')}
              divider={i > 0}
              onPress={() => open(tag)}
            />
          ))}
        </ListGroup>
      ) : null}
      <Text variant="caption" color="textMuted">
        Renaming a tag to the name of another one merges them.
      </Text>

      <Sheet visible={editing !== null && !confirmDelete} onClose={() => setEditing(null)}>
        <Text variant="heading">Edit tag</Text>
        <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="none" maxLength={40} />
        <ColorPicker value={color} onChange={setColor} />
        <Button
          title="Save"
          disabled={!name.trim()}
          onPress={() => {
            const tag = editing;
            setEditing(null);
            if (tag) run(updateTag(db, tag.id, { name, color }), 'Could not save the tag.');
          }}
        />
        <Button title="Delete tag" variant="danger" onPress={() => setConfirmDelete(true)} />
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete}
        title={`Delete #${editing?.name ?? ''}?`}
        message="The tag comes off every note. The notes stay."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          const tag = editing;
          setConfirmDelete(false);
          setEditing(null);
          if (tag) run(deleteTag(db, tag.id), 'Could not delete the tag.');
        }}
      />
    </Screen>
  );
}
