import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../ads/AdBanner';
import { useAds } from '../ads/AdsProvider';
import { THEME, CATEGORY_PALETTE, hexToRgba } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  screenBg: THEME.screenBg,
  primary: THEME.primary,
  primaryDark: THEME.primaryDark,
  gold: THEME.gold,
  text: THEME.text,
  subtext: THEME.subtext,
  dotInactive: THEME.dotInactive,
  border: THEME.border,
};

type Satellite = {
  icon: string;
  color: string;
  top: number;
  left: number;
  size?: number;
};

type Slide = {
  key: string;
  mainIcon: string;
  mainColor: string;
  satellites: Satellite[];
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    key: 'smart-tools',
    mainIcon: 'calculator-variant',
    mainColor: COLORS.primary,
    satellites: [
      { icon: 'lightbulb-on-outline', color: COLORS.gold, top: 4, left: 62 },
      { icon: 'cog-outline', color: COLORS.primary, top: 40, left: 0 },
      { icon: 'swap-horizontal', color: CATEGORY_PALETTE.indigo, top: 100, left: 10 },
      { icon: 'percent-outline', color: CATEGORY_PALETTE.rose, top: 104, left: 112 },
    ],
    title: 'Smart Financial Tools',
    description:
      'Calculate loans, estimate monthly payments, and plan your finances with confidence. Get quick, accurate results for smarter everyday decisions.',
  },
  {
    key: 'convert-pro',
    mainIcon: 'currency-usd',
    mainColor: CATEGORY_PALETTE.amber,
    satellites: [
      { icon: 'currency-inr', color: COLORS.primary, top: 0, left: 8 },
      { icon: 'currency-jpy', color: CATEGORY_PALETTE.rose, top: 0, left: 120 },
      { icon: 'currency-eur', color: CATEGORY_PALETTE.indigo, top: 112, left: 122 },
      { icon: 'currency-gbp', color: COLORS.gold, top: 116, left: 6 },
      { icon: 'currency-btc', color: COLORS.gold, top: 58, left: 138, size: 22 },
    ],
    title: 'Convert Like a Pro',
    description:
      'Convert 160+ currencies with live, up-to-the-minute exchange rates — including crypto! Perfect for travelers, online shoppers, or anyone needing quick, reliable conversions.',
  },
  {
    key: 'offline',
    mainIcon: 'cellphone',
    mainColor: COLORS.primaryDark,
    satellites: [
      { icon: 'wifi-off', color: CATEGORY_PALETTE.rose, top: 26, left: 68 },
      { icon: 'cash', color: COLORS.gold, top: 110, left: 8 },
      { icon: 'wallet-outline', color: COLORS.primary, top: 110, left: 122 },
    ],
    title: 'No Wi-Fi? No Problem',
    description:
      "Stay in control even when you're offline. Whether you're on a plane or in a remote spot, our offline mode keeps your conversions going without a hitch.",
  },
  {
    key: 'trends',
    mainIcon: 'file-chart-outline',
    mainColor: COLORS.primary,
    satellites: [
      { icon: 'magnify', color: COLORS.gold, top: 16, left: 116 },
      { icon: 'cash-multiple', color: CATEGORY_PALETTE.amber, top: 108, left: 4 },
      { icon: 'calculator-variant', color: CATEGORY_PALETTE.indigo, top: 108, left: 122 },
    ],
    title: 'Watch the Trends',
    description:
      'Track exchange rates with clear, detailed charts over days, weeks, or even years. Stay informed and make smarter financial decisions.',
  },
];

type Props = {
  onFinish: () => void;
};

function SlideIllustration({ slide }: { slide: Slide }) {
  return (
    <View style={styles.illustrationWrap}>
      <View style={styles.illustrationCircle}>
        <View
          style={[
            styles.haloCircle,
            { backgroundColor: hexToRgba(slide.mainColor, 0.08) },
          ]}
        />
        <LinearGradient
          colors={[hexToRgba(slide.mainColor, 0.22), hexToRgba(slide.mainColor, 0.1)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainIconCircle}
        >
          <Icon name={slide.mainIcon as never} size={52} color={slide.mainColor} />
        </LinearGradient>
        {slide.satellites.map((satellite, index) => (
          <View
            key={`${slide.key}-${index}`}
            style={[
              styles.satelliteCircle,
              {
                top: satellite.top,
                left: satellite.left,
                borderColor: hexToRgba(satellite.color, 0.22),
              },
            ]}
          >
            <Icon
              name={satellite.icon as never}
              size={satellite.size ?? 20}
              color={satellite.color}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function OnboardingScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const { config, registerInteraction } = useAds();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Remote Config can trim the (currently 4) slides down to a shorter intro —
  // clamp so an out-of-range value never produces an empty or overflowing list.
  const slideCount = Math.min(
    Math.max(Math.round(config.onboarding_screen_count) || SLIDES.length, 1),
    SLIDES.length,
  );
  const slides = SLIDES.slice(0, slideCount);
  const isLastSlide = activeIndex === slides.length - 1;

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
    );
    setActiveIndex(index);
  };

  const handleNext = () => {
    // Not a Home-screen tap, so this only ever competes for the interstitial
    // (never the custom_link sponsor ad) — see registerInteraction in
    // AdsProvider for the Home-only sponsor-ad rule.
    registerInteraction('click');
    if (isLastSlide) {
      onFinish();
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backdropBlobTop} />
      <View style={styles.backdropBlobBottom} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>EMI Calculator</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <SlideIllustration slide={item} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={handleNext}>
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextText}>{isLastSlide ? 'Start' : 'Next'}</Text>
            <Icon name="arrow-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={[styles.adSlot, { paddingBottom: insets.bottom }]}>
        <AdBanner placement="tools" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    overflow: 'hidden',
  },
  backdropBlobTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: hexToRgba(COLORS.primary, 0.06),
    top: -110,
    right: -80,
  },
  backdropBlobBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: hexToRgba(COLORS.gold, 0.06),
    bottom: -60,
    left: -90,
  },
  topBar: {
    paddingHorizontal: 24,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.3,
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  illustrationCircle: {
    width: 220,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloCircle: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
  },
  mainIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satelliteCircle: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: THEME.headerFrom,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14.5,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dotInactive,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 3,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adSlot: {
    minHeight: 60,
    backgroundColor: COLORS.screenBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default OnboardingScreen;
