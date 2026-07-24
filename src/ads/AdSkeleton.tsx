import { StyleProp, View, ViewStyle } from 'react-native';
import { THEME, hexToRgba } from '../theme/colors';

// The parent loader owns one shared shimmer animation. Keeping these blocks
// static avoids starting a separate animation loop for every skeleton shape.
export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: hexToRgba(THEME.primary, 0.1),
          borderRadius: 8,
        },
        style,
      ]}
    />
  );
}
