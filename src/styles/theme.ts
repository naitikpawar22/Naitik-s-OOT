export interface ThemePalette {
  mode: 'dark' | 'light';
  colors: {
    background: string;
    cardBg: string;
    cardBgHover: string;
    accent: string;
    accentLight: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderActive: string;
    glass: string;
    badgeBg: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}

export const darkTheme: ThemePalette = {
  mode: 'dark',
  colors: {
    background: '#0B0F19',
    cardBg: '#151C2C',
    cardBgHover: '#1E293B',
    accent: '#6366F1',
    accentLight: '#818CF8',
    secondary: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(99, 102, 241, 0.5)',
    glass: 'rgba(21, 28, 44, 0.85)',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
};

export const lightTheme: ThemePalette = {
  mode: 'light',
  colors: {
    background: '#F1F5F9', // Clean crisp light background
    cardBg: '#FFFFFF',     // Pure white card background
    cardBgHover: '#E2E8F0',
    accent: '#4F46E5',     // Deep Indigo Accent
    accentLight: '#6366F1',
    secondary: '#DB2777', // Vivid Pink
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    textPrimary: '#0F172A',   // High contrast dark slate text for perfect readability
    textSecondary: '#334155', // Dark gray secondary text
    textMuted: '#64748B',     // Muted gray text
    border: '#CBD5E1',        // Light border
    borderActive: '#4F46E5',
    glass: 'rgba(255, 255, 255, 0.95)',
    badgeBg: 'rgba(79, 70, 229, 0.12)',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
};

export const theme = darkTheme;
