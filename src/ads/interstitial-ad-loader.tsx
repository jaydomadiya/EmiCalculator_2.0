import { ActivityIndicator, Modal, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { THEME, hexToRgba } from '../theme/colors';

type InterstitialAdLoaderProps = {
  visible: boolean;
};

// Shared full-screen transition shown immediately before every Google
// interstitial. Keeping it in AdsProvider makes click, back and onboarding
// flows use one consistent loader without coupling it to individual screens.
function InterstitialAdLoader({ visible }: InterstitialAdLoaderProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={THEME.primaryDark} />
      <LinearGradient
        colors={[THEME.primaryDark, THEME.headerTo, '#0D4A37']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.glowBottom} />

        <View accessibilityViewIsModal style={styles.content}>
          <View style={styles.iconHaloOuter}>
            <View style={styles.iconHaloInner}>
              <LinearGradient
                colors={['#F8E8AF', THEME.gold, THEME.goldDark]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={styles.iconCircle}
              >
                <Icon name="finance" size={38} color={THEME.primaryDark} />
              </LinearGradient>
            </View>
          </View>

          <Text style={styles.eyebrow}>EMI CALCULATOR</Text>
          <Text style={styles.title}>Preparing your ad</Text>
          <Text style={styles.subtitle}>
            Please wait a moment while we get everything ready.
          </Text>

          <View style={styles.progressPill}>
            <ActivityIndicator size="small" color={THEME.gold} />
            <Text style={styles.progressText}>Loading sponsored content</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Icon name="shield-check-outline" size={16} color="#CDE5DA" />
          <Text style={styles.footerText}>Secure ad experience</Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -130,
    right: -110,
    backgroundColor: hexToRgba(THEME.gold, 0.09),
  },
  glowBottom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -110,
    left: -100,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconHaloOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    boxShadow: '0 18px 48px rgba(0,0,0,0.2)',
  },
  iconHaloInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 5,
    backgroundColor: hexToRgba(THEME.gold, 0.1),
  },
  iconCircle: {
    flex: 1,
    borderRadius: 38,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    marginTop: 26,
    color: '#CDE5DA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 310,
    marginTop: 9,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressPill: {
    minHeight: 44,
    marginTop: 26,
    paddingHorizontal: 18,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  progressText: {
    color: '#EEF8F3',
    fontSize: 12.5,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  footerText: {
    color: '#CDE5DA',
    fontSize: 11.5,
    fontWeight: '600',
  },
});

export default InterstitialAdLoader;
