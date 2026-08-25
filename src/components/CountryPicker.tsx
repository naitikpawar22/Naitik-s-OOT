import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COUNTRIES } from '../constants/categories';
import { darkTheme, ThemePalette } from '../styles/theme';

interface CountryPickerProps {
  selectedCountryCode: string;
  onSelectCountry: (countryCode: string) => void;
  activeTheme?: ThemePalette;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
  selectedCountryCode,
  onSelectCountry,
  activeTheme = darkTheme,
}) => {
  const styles = getStyles(activeTheme);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Country Index:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {COUNTRIES.map((country) => {
          const isSelected = country.code === selectedCountryCode;

          return (
            <TouchableOpacity
              key={country.code}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelectCountry(country.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {country.name}
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
      paddingBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: theme.spacing.md,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginRight: 6,
    },
    scrollContent: {
      paddingRight: theme.spacing.md,
      alignItems: 'center',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.cardBg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 6,
    },
    chipSelected: {
      backgroundColor: theme.mode === 'light' ? '#EEF2FF' : 'rgba(99, 102, 241, 0.2)',
      borderColor: theme.colors.accent,
    },
    flag: {
      fontSize: 13,
      marginRight: 4,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    chipTextSelected: {
      color: theme.colors.accent,
      fontWeight: '700',
    },
  });
