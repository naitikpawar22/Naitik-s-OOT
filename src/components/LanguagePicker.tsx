import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { LANGUAGES } from '../constants/categories';
import { darkTheme, ThemePalette } from '../styles/theme';

interface LanguagePickerProps {
  selectedLanguageCode: string;
  onSelectLanguage: (languageCode: string) => void;
  activeTheme?: ThemePalette;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  selectedLanguageCode,
  onSelectLanguage,
  activeTheme = darkTheme,
}) => {
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const styles = getStyles(activeTheme);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Language / भाषा:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = lang.code === selectedLanguageCode;
          const isFocused = lang.code === focusedCode;

          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isFocused && styles.chipFocused,
              ]}
              onPress={() => onSelectLanguage(lang.code)}
              onFocus={() => setFocusedCode(lang.code)}
              onBlur={() => setFocusedCode(null)}
              focusable={true}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {lang.name} <Text style={styles.localName}>({lang.localName})</Text>
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
    wrapper: {
      backgroundColor: theme.colors.background,
      paddingBottom: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: theme.spacing.md,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.accentLight,
      marginRight: 6,
    },
    scrollContent: {
      paddingRight: theme.spacing.md,
      alignItems: 'center',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.cardBg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 8,
    },
    chipSelected: {
      backgroundColor: theme.mode === 'light' ? '#FCE7F3' : 'rgba(236, 72, 153, 0.2)',
      borderColor: theme.colors.secondary,
    },
    chipFocused: {
      borderColor: '#38BDF8',
      borderWidth: 2,
      backgroundColor: theme.mode === 'light' ? '#E0E7FF' : 'rgba(56, 189, 248, 0.25)',
      transform: [{ scale: 1.05 }],
    },
    flag: {
      fontSize: 13,
      marginRight: 6,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    localName: {
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    chipTextSelected: {
      color: theme.mode === 'light' ? '#831843' : '#FFFFFF',
      fontWeight: '700',
    },
  });
