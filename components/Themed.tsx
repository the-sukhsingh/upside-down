/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import { Text as DefaultText, View as DefaultView, Platform, type TextProps as RNTextProps, type ViewProps as RNViewProps } from 'react-native';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & RNTextProps;
export type ViewProps = ThemeProps & RNViewProps;

const DEFAULT_FONT = Platform.select({
  web: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'Geist-Regular',
});

// Helper regex to detect Indian script characters (Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam)
const INDIC_REGEX = /[\u0900-\u0D7F]/;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, children, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const hasIndic = typeof children === 'string' && INDIC_REGEX.test(children);
  const selectedFont = hasIndic
    ? Platform.select({
        web: 'Noto Sans, -apple-system, sans-serif',
        android: 'sans-serif',
        default: 'System',
      })
    : DEFAULT_FONT;

  return (
    <DefaultText
      style={[
        { color, fontFamily: selectedFont },
        hasIndic ? { lineHeight: ((style as any)?.lineHeight || 20) + 2 } : null,
        style,
      ]}
      {...otherProps}
    >
      {children}
    </DefaultText>
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
