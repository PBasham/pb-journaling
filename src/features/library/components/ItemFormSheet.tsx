import { useState } from 'react';

import { Button, ColorPicker, Sheet, Text, TextField } from '@/components/ui';
import type { ItemColor } from '@/theme';

interface ItemFormSheetProps {
  visible: boolean;
  /** "New collection", "Edit book", ... */
  title: string;
  /** Hidden for notes, whose title is edited in the note itself. */
  showName?: boolean;
  nameLabel?: string;
  initialName?: string;
  initialColor?: ItemColor;
  saveLabel: string;
  onSave: (values: { name: string; color: ItemColor }) => void;
  onClose: () => void;
}

/** Name and color for a collection or book (color only for a note). */
export function ItemFormSheet({
  visible,
  title,
  showName = true,
  nameLabel = 'Name',
  initialName = '',
  initialColor = 'slate',
  saveLabel,
  onSave,
  onClose,
}: ItemFormSheetProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<ItemColor>(initialColor);

  // Start from the given values each time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setName(initialName);
      setColor(initialColor);
    }
  }

  const canSave = !showName || name.trim().length > 0;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="heading">{title}</Text>
      {showName ? (
        <TextField
          label={nameLabel}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          maxLength={80}
          onSubmitEditing={() => canSave && onSave({ name, color })}
        />
      ) : null}
      <ColorPicker value={color} onChange={setColor} />
      <Button title={saveLabel} disabled={!canSave} onPress={() => onSave({ name, color })} />
    </Sheet>
  );
}
