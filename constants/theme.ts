/**
 * MeetaNotes Design System Tokens
 * Brand ramps (Tailwind violet / emerald / zinc) & Semantic Tokens
 * Strict dark theme values with Geist & Geist Mono typography.
 */

export const brand = {
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA', // Base
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
    950: '#2E1065',
  },
  tertiary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399', // Base
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },
  zinc: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A', // Secondary base
    600: '#52525B',
    700: '#3F3F46', // Neutral base
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
} as const;

export const semantic = {
  bg: '#0B0B0F',
  surface: '#131318',
  surfaceRaised: '#1B1B22',
  border: '#26262E',
  borderStrong: '#3F3F46',

  text: '#F4F4F5',
  textSoft: '#A1A1AA',
  textFaint: '#71717A',

  primary: '#A78BFA',
  primaryTonal: '#C4B5FD',
  onPrimaryTonal: '#2E1065',
  primaryStrong: '#5B21B6',
  onPrimaryStrong: '#F5F3FF',
  primarySoft: 'rgba(167, 139, 250, 0.14)',

  success: '#34D399',
  successTonal: '#6EE7B7',
  onSuccessTonal: '#022C22',
  successSoft: 'rgba(52, 211, 153, 0.14)',

  danger: '#FB7185',
  dangerSoft: 'rgba(251, 113, 133, 0.14)',

  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.14)',

  inverted: '#E4E4E7',
  onInverted: '#18181B',
} as const;

export const radius = {
  card: 20,
  innerCard: 14,
  button: 10,
  input: 10,
  chip: 999,
  pill: 999,
  circleIcon: 36,
  bottomSheet: 24,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPadding: 20,
  cardGap: 16,
  cardPadding: 16,
} as const;

export const fontNames = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semiBold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  mono: 'GeistMono-Regular',
  monoRegular: 'GeistMono-Regular',
  monoMedium: 'GeistMono-Medium',
  monoSemiBold: 'GeistMono-SemiBold',
} as const;

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600' as const,
    fontFamily: fontNames.semiBold,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600' as const,
    fontFamily: fontNames.semiBold,
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    fontFamily: fontNames.semiBold,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    fontFamily: fontNames.regular,
  },
  bodySoft: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: fontNames.regular,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500' as const,
    fontFamily: fontNames.medium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: fontNames.medium,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    fontFamily: fontNames.semiBold,
  },
  timerMono: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '600' as const,
    fontFamily: fontNames.monoSemiBold,
  },
  timestampMono: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500' as const,
    fontFamily: fontNames.monoMedium,
  },
} as const;

export default {
  brand,
  semantic,
  radius,
  spacing,
  fontNames,
  typography,
};
