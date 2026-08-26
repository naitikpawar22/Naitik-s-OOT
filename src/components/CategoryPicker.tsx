import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../constants/categories';
import { darkTheme, ThemePalette } from '../styles/theme';

interface CategoryPickerProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  activeTheme?: ThemePalette;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategoryId,
  onSelectCategory,
  activeTheme = darkTheme,
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const styles = getStyles(activeTheme);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = category.id === selectedCategoryId;
          const isFocused = category.id === focusedId;

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isFocused && styles.chipFocused,
              ]}
              onPress={() => onSelectCategory(category.id)}
              onFocus={() => setFocusedId(category.id)}
              onBlur={() => setFocusedId(null)}
              focusable={true}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={isFocused ? '#38BDF8' : isSelected ? '#FFFFFF' : activeTheme.colors.textSecondary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  isFocused && styles.chipTextFocused,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      paddingVertical: theme.spacing.xs,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.cardBg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 8,
    },
    chipSelected: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accentLight,
    },
    chipFocused: {
      borderColor: '#38BDF8',
      borderWidth: 2,
      backgroundColor: theme.mode === 'light' ? '#E0E7FF' : 'rgba(56, 189, 248, 0.25)',
      transform: [{ scale: 1.05 }],
    },
    icon: {
      marginRight: 6,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    chipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    chipTextFocused: {
      color: '#38BDF8',
      fontWeight: '800',
    },
  });
