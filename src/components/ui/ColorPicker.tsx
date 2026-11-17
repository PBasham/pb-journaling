import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { createStyles, itemColorNames, itemColors, itemColorValue, useTheme, type ItemColor } from '@/theme';

interface ColorPickerProps {
  value: ItemColor;
  onChange: (color: ItemColor) => void;
}

/** A row of color swatches for a collection, book or note. */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Color">
      {itemColorNames.map((name) => {
        const selected = name === value;
        return (
          <Pressable
            key={name}
            accessibilityRole="radio"
            accessibilityLabel={itemColors[name].label}
            aria-checked={selected}
            onPress={() => onChange(name)}
            hitSlop={4}
            style={[styles.swatch, { backgroundColor: itemColorValue(theme, name) }, selected && styles.selected]}>
            {selected ? <Ionicons name="checkmark" size={18} color={theme.colors.surface} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const SWATCH = 34;

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.md,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 3,
    borderColor: t.colors.text,
  },
}));
