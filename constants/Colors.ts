/**
 * MeetaNotes UI Kit Color Tokens (Lokanaka Studio)
 * Warm Terracotta Coral, Forest Moss Olive, Warm Amber, and Organic Cream surfaces.
 * Full semantic token architecture with tonal surface containers,
 * primary/secondary/tertiary pairs, and dynamic light/dark values.
 */

export interface M3ColorScheme {
  // Brand & Accent roles
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // MeetaNotes Specific Accents
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

  // Surface Hierarchy
  background: string;
  onBackground: string;
  surface: string;
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

  // Mappings for component styles
  text: string;
  textSecondary: string;
  textMuted: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  primaryText: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
}

const lightTheme: M3ColorScheme = {
  // Primary (MeetaNotes Terracotta Coral)
  primary: '#E06D53',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FDF4F2',
  onPrimaryContainer: '#C8533A',

  // Secondary (Forest Moss Olive Green)
  secondary: '#4D5C3B',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#EBF0E6',
  onSecondaryContainer: '#2D3723',

  // Tertiary (Warm Amber Accent)
  tertiary: '#F5C242',
  onTertiary: '#3D2E00',
  tertiaryContainer: '#FEF3D6',
  onTertiaryContainer: '#5C4500',

  // Dedicated MeetaNotes Accents
  coral: '#E06D53',
  coralLight: '#FDF4F2',
  coralDark: '#C8533A',
  olive: '#4D5C3B',
  oliveLight: '#EBF0E6',
  oliveDark: '#3A472C',
  oliveText: '#F4F6F1',
  amber: '#F5C242',

  // Error (Clean Crimson)
  error: '#E53935',
  onError: '#FFFFFF',
  errorContainer: '#FFEBEE',
  onErrorContainer: '#5C0A0A',

  // Surface Tonal Hierarchy (Warm Cream & Organic White)
  background: '#FBF9F7',
  onBackground: '#191A1D',
  surface: '#FFFFFF',
  onSurface: '#191A1D',
  surfaceVariant: '#F3EFEA',
  onSurfaceVariant: '#686B73',

  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FFFFFF',
  surfaceContainer: '#F7F5F2',
  surfaceContainerHigh: '#EDE9E3',
  surfaceContainerHighest: '#E4DFD7',

  // Outlines & Borders
  outline: '#D0CBC4',
  outlineVariant: 'rgba(0, 0, 0, 0.06)',

  // Semantic Mappings
  text: '#191A1D',
  textSecondary: '#686B73',
  textMuted: '#9EA2AA',
  card: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  cardHover: '#F8F5F1',
  tint: '#E06D53',
  tabIconDefault: '#9EA2AA',
  tabIconSelected: '#E06D53',
  border: 'rgba(0, 0, 0, 0.06)',
  primaryText: '#FFFFFF',
  accent: '#4D5C3B',
  accentLight: '#EBF0E6',
  accentBorder: '#C4D3BB',
  danger: '#E53935',
  dangerLight: '#FFEBEE',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
};

const darkTheme: M3ColorScheme = {
  // Primary (Warm Coral Night)
  primary: '#E2725B',
  onPrimary: '#2C0E07',
  primaryContainer: '#5C2518',
  onPrimaryContainer: '#FADCD5',

  // Secondary (Muted Forest Olive)
  secondary: '#7D9465',
  onSecondary: '#18230F',
  secondaryContainer: '#2D3820',
  onSecondaryContainer: '#D9E5CC',

  // Tertiary (Warm Amber Night)
  tertiary: '#F5C242',
  onTertiary: '#3D2E00',
  tertiaryContainer: '#4D3900',
  onTertiaryContainer: '#FEF3D6',

  // Dedicated MeetaNotes Accents
  coral: '#E2725B',
  coralLight: '#3D1B14',
  coralDark: '#C8533A',
  olive: '#556844',
  oliveLight: '#28331E',
  oliveDark: '#1E2716',
  oliveText: '#F4F6F1',
  amber: '#F5C242',

  // Error
  error: '#EF5350',
  onError: '#3E0808',
  errorContainer: '#5C1414',
  onErrorContainer: '#FFCDD2',

  // Surface Tonal Hierarchy (Rich Obsidian & Sleek Charcoal)
  background: '#121316',
  onBackground: '#F4F5F7',
  surface: '#1C1E22',
  onSurface: '#F4F5F7',
  surfaceVariant: '#24272D',
  onSurfaceVariant: '#9DA1AA',

  surfaceContainerLowest: '#0D0E10',
  surfaceContainerLow: '#16171B',
  surfaceContainer: '#1C1E22',
  surfaceContainerHigh: '#24272D',
  surfaceContainerHighest: '#2D3038',

  // Outlines
  outline: '#484C55',
  outlineVariant: 'rgba(255, 255, 255, 0.08)',

  // Semantic Mappings
  text: '#F4F5F7',
  textSecondary: '#9DA1AA',
  textMuted: '#6E727C',
  card: '#1C1E22',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardHover: '#24272D',
  tint: '#E2725B',
  tabIconDefault: '#6E727C',
  tabIconSelected: '#E2725B',
  border: 'rgba(255, 255, 255, 0.08)',
  primaryText: '#FFFFFF',
  accent: '#7D9465',
  accentLight: '#2D3820',
  accentBorder: '#4B5C37',
  danger: '#EF5350',
  dangerLight: '#3E1818',
  warning: '#FBBF24',
  warningLight: '#422006',
};

export default {
  light: lightTheme,
  dark: darkTheme,
};
