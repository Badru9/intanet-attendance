// app/constants/designTokens.ts
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Font families mapping
export const FONT_FAMILIES = {
  light: 'Urbanist-Light',
  regular: 'Urbanist-Regular',
  medium: 'Urbanist-Medium',
  semibold: 'Urbanist-Semibold',
} as const;

// Font weight type for better type safety
type FontWeight =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

export const DESIGN_TOKENS = {
  colors: {
    primary: '#2563EB' as const,
    secondary: '#5856D6' as const,
    success: '#10B981' as const,
    error: '#EF4444' as const,
    warning: '#F59E0B' as const,
    pending: '#3B82F6' as const,
    background: '#FAFAFA' as const,
    backgroundPrimary: '#2563EB' as const,
    backgroundDark: '#0F172A' as const,
    surface: '#FFFFFF' as const,
    // Typography
    textPrimary: '#1F2937' as const,
    textSecondary: '#6B7280' as const,
    textTertiary: '#FFFFFF' as const,
    // Border
    border: '#E5E7EB' as const,
  },
  spacing: {
    xs: 4 as const,
    sm: 8 as const,
    md: 16 as const,
    lg: 24 as const,
    xl: 32 as const,
    xxl: 40 as const,
    xxxl: 60 as const,
  },
  borderRadius: {
    sm: 12 as const,
    md: 16 as const,
    lg: 20 as const,
    xl: 24 as const,
    full: 999 as const,
  },
  typography: {
    // Large headings dengan Urbanist-Semibold
    h1: {
      fontSize: 28 as const,
      fontFamily: FONT_FAMILIES.semibold,
      fontWeight: '600' as FontWeight,
      letterSpacing: -0.6 as const,
      lineHeight: 34 as const,
    },
    h2: {
      fontSize: 24 as const,
      fontFamily: FONT_FAMILIES.semibold,
      fontWeight: '600' as FontWeight,
      letterSpacing: -0.5 as const,
      lineHeight: 30 as const,
    },
    h3: {
      fontSize: 20 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      letterSpacing: -0.3 as const,
      lineHeight: 26 as const,
    },
    h4: {
      fontSize: 18 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      letterSpacing: -0.2 as const,
      lineHeight: 24 as const,
    },
    // Body text dengan Urbanist-Regular dan Urbanist-Medium
    body: {
      fontSize: 16 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      lineHeight: 24 as const,
    },
    bodyRegular: {
      fontSize: 16 as const,
      fontFamily: FONT_FAMILIES.regular,
      fontWeight: '400' as FontWeight,
      lineHeight: 24 as const,
    },
    bodyLight: {
      fontSize: 16 as const,
      fontFamily: FONT_FAMILIES.light,
      fontWeight: '300' as FontWeight,
      lineHeight: 24 as const,
    },
    bodyLarge: {
      fontSize: 18 as const,
      fontFamily: FONT_FAMILIES.regular,
      fontWeight: '400' as FontWeight,
      lineHeight: 26 as const,
    },
    // Button text
    button: {
      fontSize: 16 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      letterSpacing: 0.2 as const,
    },
    buttonLarge: {
      fontSize: 18 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      letterSpacing: 0.2 as const,
    },
    // Small text variants
    caption: {
      fontSize: 14 as const,
      fontFamily: FONT_FAMILIES.regular,
      fontWeight: '400' as FontWeight,
      lineHeight: 20 as const,
    },
    captionMedium: {
      fontSize: 14 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      lineHeight: 20 as const,
    },
    small: {
      fontSize: 12 as const,
      fontFamily: FONT_FAMILIES.regular,
      fontWeight: '400' as FontWeight,
      lineHeight: 16 as const,
    },
    // Error/validation text
    error: {
      fontSize: 12 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      lineHeight: 16 as const,
    },
    // Labels untuk form inputs
    label: {
      fontSize: 14 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as FontWeight,
      lineHeight: 20 as const,
    },
    // Navigation/tab text
    tabLabel: {
      fontSize: 12 as const,
      fontFamily: FONT_FAMILIES.medium,
      fontWeight: '500' as const,
      lineHeight: 16 as const,
    },
    // Default base text style - selalu gunakan Urbanist-Regular sebagai fallback
    baseText: {
      fontFamily: FONT_FAMILIES.regular,
    },
  },
  // Elevation/Shadow untuk depth
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  // Device dimensions for responsive design
  dimensions: {
    screenWidth,
    screenHeight,
    // Breakpoints untuk responsive design
    isSmallDevice: screenWidth < 375,
    isMediumDevice: screenWidth >= 375 && screenWidth < 414,
    isLargeDevice: screenWidth >= 414,
  },
} as const;

// Helper types untuk TypeScript IntelliSense
export type DesignTokens = typeof DESIGN_TOKENS;
export type ColorTokens = keyof typeof DESIGN_TOKENS.colors;
export type SpacingTokens = keyof typeof DESIGN_TOKENS.spacing;
export type TypographyTokens = keyof typeof DESIGN_TOKENS.typography;
export type BorderRadiusTokens = keyof typeof DESIGN_TOKENS.borderRadius;
export type FontFamilyTokens = keyof typeof FONT_FAMILIES;
