/**
 * MeetaNotes UI Kit Color Tokens
 * Tailored to strict Tailwind Violet / Emerald / Zinc dark palette.
 * Replaces old terracotta / olive / organic cream with semantic design tokens.
 */
import { brand, semantic } from './theme';

export interface M3ColorScheme {
  // Brand & Accent roles
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  primaryTonal: string;
  onPrimaryTonal: string;
  primaryStrong: string;
  onPrimaryStrong: string;
  primarySoft: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  success: string;
  successTonal: string;
  onSuccessTonal: string;
  successSoft: string;

  // MeetaNotes Specific Accents (Mapped to new tokens)
  coral: string;
  coralLight: string;
  coralDark: string;
  olive: string;
  oliveLight: string;
  oliveDark: string;
  oliveText: string;
  amber: string;

  // Feedback
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  danger: string;
  dangerSoft: string;
  dangerLight: string;
  warning: string;
  warningSoft: string;
  warningLight: string;

  // Surface Hierarchy
  background: string;
  onBackground: string;
  surface: string;
  surfaceRaised: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Outlines & Dividers
  outline: string;
  outlineVariant: string;
  border: string;
  borderStrong: string;

  // Semantic Mappings
  text: string;
  textSecondary: string;
  textSoft: string;
  textFaint: string;
  textMuted: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primaryText: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  inverted: string;
  onInverted: string;
  shadow: string;
}

const themeTokens: M3ColorScheme = {
  // Primary (Tailwind Violet 400 base)
  primary: semantic.primary,
  onPrimary: semantic.onPrimaryTonal,
  primaryContainer: semantic.primarySoft,
  onPrimaryContainer: semantic.primaryTonal,

  primaryTonal: semantic.primaryTonal,
  onPrimaryTonal: semantic.onPrimaryTonal,
  primaryStrong: semantic.primaryStrong,
  onPrimaryStrong: semantic.onPrimaryStrong,
  primarySoft: semantic.primarySoft,

  // Secondary (Zinc 500 base)
  secondary: brand.zinc[500],
  onSecondary: brand.zinc[50],
  secondaryContainer: semantic.surfaceRaised,
  onSecondaryContainer: semantic.textSoft,

  // Tertiary (Emerald 400 base)
  tertiary: semantic.success,
  onTertiary: semantic.onSuccessTonal,
  tertiaryContainer: semantic.successSoft,
  onTertiaryContainer: semantic.successTonal,

  success: semantic.success,
  successTonal: semantic.successTonal,
  onSuccessTonal: semantic.onSuccessTonal,
  successSoft: semantic.successSoft,

  // Accents mapped to new palette
  coral: semantic.primary,
  coralLight: semantic.primarySoft,
  coralDark: semantic.primaryStrong,
  olive: semantic.success,
  oliveLight: semantic.successSoft,
  oliveDark: brand.tertiary[800],
  oliveText: semantic.onSuccessTonal,
  amber: semantic.warning,

  // Feedback
  error: semantic.danger,
  onError: semantic.onInverted,
  errorContainer: semantic.dangerSoft,
  onErrorContainer: semantic.danger,
  danger: semantic.danger,
  dangerSoft: semantic.dangerSoft,
  dangerLight: semantic.dangerSoft,
  warning: semantic.warning,
  warningSoft: semantic.warningSoft,
  warningLight: semantic.warningSoft,

  // Surfaces
  background: semantic.bg,
  onBackground: semantic.text,
  surface: semantic.surface,
  surfaceRaised: semantic.surfaceRaised,
  onSurface: semantic.text,
  surfaceVariant: semantic.surfaceRaised,
  onSurfaceVariant: semantic.textSoft,

  surfaceContainerLowest: semantic.bg,
  surfaceContainerLow: semantic.surface,
  surfaceContainer: semantic.surfaceRaised,
  surfaceContainerHigh: semantic.border,
  surfaceContainerHighest: semantic.borderStrong,

  // Outlines & Borders
  outline: semantic.border,
  outlineVariant: semantic.borderStrong,
  border: semantic.border,
  borderStrong: semantic.borderStrong,

  // Mappings
  text: semantic.text,
  textSecondary: semantic.textSoft,
  textSoft: semantic.textSoft,
  textFaint: semantic.textFaint,
  textMuted: semantic.textFaint,
  card: semantic.surface,
  cardBorder: semantic.border,
  cardHover: semantic.surfaceRaised,
  tint: semantic.primary,
  tabIconDefault: semantic.textFaint,
  tabIconSelected: semantic.primary,
  primaryText: semantic.onPrimaryStrong,
  accent: semantic.primary,
  accentLight: semantic.primarySoft,
  accentBorder: semantic.borderStrong,
  inverted: semantic.inverted,
  onInverted: semantic.onInverted,
  shadow: semantic.bg,
};

export default {
  light: themeTokens,
  dark: themeTokens,
};
