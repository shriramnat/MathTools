export interface Theme {
  id: string;
  name: string;
  emoji: string;
  colors: {
    /** Page background */
    bgPrimary: string;
    /** Card background */
    bgCard: string;
    /** Top bar background */
    bgTopBar: string;
    /** Primary text */
    textPrimary: string;
    /** Secondary text */
    textSecondary: string;
    /** Accent color for buttons/highlights */
    accent: string;
    /** Accent hover */
    accentHover: string;
    /** Card border */
    cardBorder: string;
    /** Separator line in problems */
    problemLine: string;
    /** Success color */
    success: string;
    /** Error color */
    error: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Sky Blue',
    emoji: '☁️',
    colors: {
      bgPrimary: '#f0f9ff',
      bgCard: '#ffffff',
      bgTopBar: '#ffffff',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      cardBorder: '#e2e8f0',
      problemLine: '#1e293b',
      success: '#16a34a',
      error: '#dc2626',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    colors: {
      bgPrimary: '#f0fdf4',
      bgCard: '#ffffff',
      bgTopBar: '#ffffff',
      textPrimary: '#14532d',
      textSecondary: '#4ade80',
      accent: '#22c55e',
      accentHover: '#16a34a',
      cardBorder: '#bbf7d0',
      problemLine: '#14532d',
      success: '#15803d',
      error: '#ef4444',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    colors: {
      bgPrimary: '#fff7ed',
      bgCard: '#ffffff',
      bgTopBar: '#ffffff',
      textPrimary: '#431407',
      textSecondary: '#9a3412',
      accent: '#f97316',
      accentHover: '#ea580c',
      cardBorder: '#fed7aa',
      problemLine: '#431407',
      success: '#16a34a',
      error: '#dc2626',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    emoji: '💜',
    colors: {
      bgPrimary: '#faf5ff',
      bgCard: '#ffffff',
      bgTopBar: '#ffffff',
      textPrimary: '#3b0764',
      textSecondary: '#7c3aed',
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      cardBorder: '#e9d5ff',
      problemLine: '#3b0764',
      success: '#16a34a',
      error: '#dc2626',
    },
  },
];

export function getTheme(themeId: string): Theme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}