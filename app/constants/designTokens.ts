// app/constants/designTokens.ts

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    primary: '#007AFF' as const, // iOS Blue
    secondary: '#5856D6' as const, // Secondary blue
    accent: '#FF9500' as const, // iOS Orange
    success: '#34C759' as const, // iOS Green
    error: '#FF3B30' as const, // iOS Red
    warning: '#FF9500' as const, // iOS Orange (duplicate, keep for consistency)

    // Glass morphism palette
    glassBg: 'rgba(255, 255, 255, 0.12)' as const,
    glassCardBg: 'rgba(255, 255, 255, 0.15)' as const, // Slightly more opaque for cards
    glassBorder: 'rgba(255, 255, 255, 0.25)' as const,
    glassInputBg: 'rgba(255, 255, 255, 0.08)' as const,
    glassInputFocused: 'rgba(255, 255, 255, 0.15)' as const,
    glassOverlay: 'rgba(0, 0, 0, 0.4)' as const, // For modal backgrounds etc.

    // Typography
    textPrimary: 'rgba(255, 255, 255, 0.95)' as const,
    textSecondary: 'rgba(255, 255, 255, 0.75)' as const,
    textTertiary: 'rgba(255, 255, 255, 0.55)' as const,
    textPlaceholder: 'rgba(255, 255, 255, 0.4)' as const,
    textOnButton: 'rgba(255, 255, 255, 0.95)' as const,
  },

  spacing: {
    xs: 4 as const,
    sm: 8 as const,
    md: 16 as const,
    lg: 24 as const,
    xl: 32 as const,
    xxl: 40 as const,
    xxxl: 60 as const, // Added for larger spacing
  },

  borderRadius: {
    sm: 12 as const,
    md: 16 as const,
    lg: 20 as const,
    xl: 24 as const,
    full: 999 as const, // For fully rounded elements
  },

  typography: {
    h1: {
      fontSize: 32 as const,
      fontWeight: '700' as FontWeight,
      letterSpacing: -0.5 as const,
    },
    h2: {
      fontSize: 24 as const,
      fontWeight: '600' as FontWeight,
      letterSpacing: -0.4 as const,
    },
    h3: {
      fontSize: 20 as const,
      fontWeight: '600' as FontWeight,
      letterSpacing: -0.3 as const,
    },
    body: {
      fontSize: 16 as const,
      fontWeight: '500' as FontWeight,
    },
    bodyLight: {
      fontSize: 16 as const,
      fontWeight: '400' as FontWeight,
    },
    button: {
      fontSize: 17 as const,
      fontWeight: '600' as FontWeight,
      letterSpacing: 0.2 as const,
    },
    caption: {
      fontSize: 14 as const,
      fontWeight: '500' as FontWeight,
    },
    small: {
      fontSize: 12 as const,
      fontWeight: '400' as FontWeight,
    },
    error: {
      fontSize: 12 as const,
      fontWeight: '500' as FontWeight,
    },
  },

  // Device dimensions for responsive design if needed
  dimensions: {
    screenWidth,
    screenHeight,
  },
} as const;
