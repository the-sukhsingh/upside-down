import { Platform } from 'react-native';
import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  const monoFont = Platform.select({
    web: 'Geist Mono, monospace',
    default: 'GeistMono-Medium',
  });
  return <Text {...props} style={[{ fontFamily: monoFont }, props.style]} />;
}
