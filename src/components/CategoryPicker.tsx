import React from 'react';
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

          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={isSelected ? '#FFFFFF' : activeTheme.colors.textSecondary}
                style={styles.icon}
              />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
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
      ...Platform.select({
        web: {
          boxShadow: '0px 2px 5px rgba(99, 102, 241, 0.4)',
        },
        default: {
          shadowColor: theme.colors.accent,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 5,
          elevation: 3,
        },
      }),
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
  });
