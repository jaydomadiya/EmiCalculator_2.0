import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, hexToRgba } from '../theme/colors';
import { SkeletonBlock } from './AdSkeleton';

type NativeAdLoaderProps = {
  format: 'compact' | 'medium';
};

// Premium placeholder for a native ad request. One shimmer animation moves
// across the whole card, while static blocks preserve the final ad layout.
function NativeAdLoader({ format }: NativeAdLoaderProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <LinearGradient
      colors={[THEME.cardBg, '#F4F9F6', '#FFFCF3']}
      locations={[0, 0.56, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={format === 'compact' ? styles.compactCard : styles.mediumCard}
    >
      <View style={styles.loaderHeader}>
        <View style={styles.loaderBadge}>
          <View style={styles.loaderBadgeDot} />
          <Text style={styles.loaderBadgeText}>SPONSORED</Text>
        </View>
        <View style={styles.loaderStatus}>
          <ActivityIndicator size="small" color={THEME.goldDark} />
          <Text style={styles.loaderStatusText}>Loading ad</Text>
        </View>
      </View>

      {format === 'compact' ? (
        <View style={styles.compactBodyRow}>
          <SkeletonBlock style={styles.compactIcon} />
          <View style={styles.compactCopy}>
            <SkeletonBlock style={styles.compactHeadline} />
            <SkeletonBlock style={styles.compactBodyLine} />
          </View>
          <SkeletonBlock style={styles.compactCta} />
        </View>
      ) : (
        <>
          <View style={styles.mediumIdentityRow}>
            <SkeletonBlock style={styles.mediumIcon} />
            <View style={styles.mediumIdentityCopy}>
              <SkeletonBlock style={styles.mediumHeadline} />
              <SkeletonBlock style={styles.mediumAdvertiser} />
            </View>
          </View>
          <SkeletonBlock style={styles.mediumBodyLine1} />
          <SkeletonBlock style={styles.mediumBodyLine2} />
          <SkeletonBlock style={styles.mediumMedia} />
          <SkeletonBlock style={styles.mediumCta} />
        </>
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            width: Math.max(120, width * 0.36),
            transform: [{ translateX: shimmerTranslateX }, { skewX: '-12deg' }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.72)', 'transparent']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const sharedCard = {
  overflow: 'hidden' as const,
  backgroundColor: THEME.cardBg,
  borderWidth: 1,
  borderColor: hexToRgba(THEME.gold, 0.28),
  boxShadow: `0 8px 24px ${hexToRgba(THEME.primaryDark, 0.09)}`,
};

const styles = StyleSheet.create({
  compactCard: {
    ...sharedCard,
    minHeight: 102,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 8,
    padding: 10,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  mediumCard: {
    ...sharedCard,
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  loaderHeader: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  loaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 18,
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: hexToRgba(THEME.gold, 0.14),
    borderWidth: 1,
    borderColor: hexToRgba(THEME.gold, 0.24),
  },
  loaderBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: THEME.goldDark,
  },
  loaderBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: THEME.goldDark,
  },
  loaderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loaderStatusText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: THEME.subtext,
  },
  compactBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 8,
  },
  compactIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  compactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  compactHeadline: {
    width: '88%',
    height: 11,
    borderRadius: 6,
  },
  compactBodyLine: {
    width: '68%',
    height: 9,
    borderRadius: 5,
  },
  compactCta: {
    width: 80,
    height: 38,
    borderRadius: 9,
    backgroundColor: hexToRgba(THEME.primary, 0.16),
  },
  mediumIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  mediumIcon: {
    width: 40,
    height: 40,
    borderRadius: 9,
  },
  mediumIdentityCopy: {
    flex: 1,
    gap: 8,
  },
  mediumHeadline: {
    width: '68%',
    height: 13,
    borderRadius: 7,
  },
  mediumAdvertiser: {
    width: '42%',
    height: 10,
    borderRadius: 5,
  },
  mediumBodyLine1: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    marginTop: 12,
  },
  mediumBodyLine2: {
    width: '78%',
    height: 10,
    borderRadius: 5,
    marginTop: 7,
  },
  mediumMedia: {
    width: '100%',
    height: 140,
    borderRadius: 11,
    marginTop: 10,
  },
  mediumCta: {
    width: '100%',
    height: 42,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: hexToRgba(THEME.primary, 0.16),
  },
  shimmer: {
    position: 'absolute',
    top: -30,
    bottom: -30,
  },
});

export default NativeAdLoader;
