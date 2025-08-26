// Font Utilities
export const FONT_FAMILY_PRIMARY = '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif';

// Font weights
export const FONT_WEIGHTS = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Font sizes
export const FONT_SIZES = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
} as const;

// Helper function to get font styles
export const getFontStyles = (size: keyof typeof FONT_SIZES = 'base', weight: keyof typeof FONT_WEIGHTS = 'normal') => ({
  fontFamily: FONT_FAMILY_PRIMARY,
  fontSize: FONT_SIZES[size],
  fontWeight: FONT_WEIGHTS[weight],
});

// Common font style objects
export const FONT_STYLES = {
  title: getFontStyles('2xl', 'bold'),
  subtitle: getFontStyles('xl', 'semibold'),
  body: getFontStyles('base', 'normal'),
  button: getFontStyles('base', 'semibold'),
  caption: getFontStyles('sm', 'normal'),
} as const; 