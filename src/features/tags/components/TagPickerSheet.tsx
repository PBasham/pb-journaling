import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ListGroup, ListRow, Sheet, Text, TextField } from '@/components/ui';
import { useDb } from '@/db';
import { run } from '@/lib/errors';
import { createStyles, itemColorValue, useTheme } from '@/theme';

import { useNoteTags, useTagsWithCounts } from '../queries';
import { findOrCreateTag, setNoteTags } from '../tags';

/** Pick a note's tags, or make a new one. Changes save right away. */
export function TagPickerSheet({ noteId, visible, onClose }: { noteId: string; visible: boolean; onClose: () => void }) {
  const db = useDb();
  const styles = useStyles();
  const theme = useTheme();
  const { data: all } = useTagsWithCounts();
  const { data: current } = useNoteTags(noteId);
  const [name, setName] = useState('');
  const selected = new Set(current.map((t) => t.id));

  const toggle = (tagId: string) => {
    const next = selected.has(tagId) ? [...selected].filter((id) => id !== tagId) : [...selected, tagId];
    run(setNoteTags(db, noteId, next), 'Could not change the tags.');
  };

  const add = () => {
    const clean = name.trim();
    if (!clean) return;
    setName('');
    run(
      findOrCreateTag(db, clean).then((tag) => setNoteTags(db, noteId, [...selected, tag.id])),
      'Could not add the tag.',
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="heading">Tags</Text>
      <View style={styles.addRow}>
        <View style={styles.flex}>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder="New tag"
            accessibilityLabel="New tag"
            autoCapitalize="none"
            returnKeyType="done"
            maxLength={40}
            onSubmitEditing={add}
          />
        </View>
        <Button title="Add" disabled={!name.trim()} onPress={add} />
      </View>
      {all.length ? (
        <ScrollView style={styles.list}>
          <ListGroup>
            {all.map((tag, i) => (
              <ListRow
                key={tag.id}
                title={`#${tag.name}`}
                description={`${tag.count} ${tag.count === 1 ? 'note' : 'notes'}`}
                divider={i > 0}
                onPress={() => toggle(tag.id)}
                right={
                  selected.has(tag.id) ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={itemColorValue(theme, tag.color)} />
                  )
                }
              />
            ))}
          </ListGroup>
        </ScrollView>
      ) : (
        <Text color="textMuted">No tags yet. Type one above, like recipe or todo.</Text>
      )}
    </Sheet>
  );
}

const useStyles = createStyles((t) => ({
  addRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  flex: { flex: 1 },
  list: { maxHeight: 360 },
}));
