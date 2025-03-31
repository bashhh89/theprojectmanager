export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main QanDu blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  // Secondary brand color
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // QanDu purple
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  // Semantic colors
  success: {
    light: '#86efac',
    DEFAULT: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fed7aa',
    DEFAULT: '#f97316',
    dark: '#c2410c',
  },
  error: {
    light: '#fca5a5',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#a5f3fc',
    DEFAULT: '#06b6d4',
    dark: '#0e7490',
  },
  // Neutral colors for text, backgrounds, etc.
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
};

export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  }
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
};

export const animation = {
  durations: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    verySlow: '500ms',
  },
  timingFunctions: {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
    easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
};

export const zIndices = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: 'auto',
};

// Component-specific design tokens
export const components = {
  // Button variants
  button: {
    primary: {
      bg: colors.primary[500],
      text: colors.neutral[50],
      hoverBg: colors.primary[600],
      activeBg: colors.primary[700],
    },
    secondary: {
      bg: colors.secondary[500],
      text: colors.neutral[50],
      hoverBg: colors.secondary[600],
      activeBg: colors.secondary[700],
    },
    outline: {
      bg: 'transparent',
      text: colors.primary[500],
      border: colors.primary[500],
      hoverBg: colors.primary[50],
      activeBg: colors.primary[100],
    },
    ghost: {
      bg: 'transparent',
      text: colors.neutral[700],
      hoverBg: colors.neutral[100],
      activeBg: colors.neutral[200],
    },
  },
  // Card styles
  card: {
    bg: colors.neutral[50],
    bgDark: colors.neutral[900],
    border: colors.neutral[200],
    borderDark: colors.neutral[800],
    shadow: shadows.md,
  },
  // Input styles
  input: {
    bg: colors.neutral[50],
    bgDark: colors.neutral[900],
    border: colors.neutral[300],
    borderDark: colors.neutral[700],
    text: colors.neutral[900],
    textDark: colors.neutral[50],
    placeholder: colors.neutral[400],
    focusBorder: colors.primary[500],
  },
};

// Animation variants for transitions
export const transitions = {
  // Page transitions
  page: {
    enter: {
      duration: animation.durations.normal,
      timing: animation.timingFunctions.easeOut,
    },
    exit: {
      duration: animation.durations.fast,
      timing: animation.timingFunctions.easeIn,
    },
  },
  // Modal/dialog transitions
  modal: {
    enter: {
      duration: animation.durations.normal,
      timing: animation.timingFunctions.easeOut,
    },
    exit: {
      duration: animation.durations.fast,
      timing: animation.timingFunctions.easeIn,
    },
  },
  // Chat message animations
  chatMessage: {
    appear: {
      duration: animation.durations.normal,
      timing: animation.timingFunctions.easeOut,
    },
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}; 