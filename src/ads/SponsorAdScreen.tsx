import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../theme/colors';

type SponsorAdScreenProps = {
  visible: boolean;
  url: string;
  onClose: () => void;
};

// Full-screen in-app screen for the custom_link house ad. Loads the sponsor's
// page directly inside a WebView instead of handing off to the system browser.
function SponsorAdScreen({ visible, url, onClose }: SponsorAdScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        setLoading(true);
        setFailed(false);
      }}
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton} hitSlop={12}>
            <Icon name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SPONSORED</Text>
          </View>
        </View>

        {failed ? (
          <View style={styles.centerFill}>
            <Icon name="wifi-off" size={40} color={THEME.subtext} />
            <Text style={styles.errorText}>Couldn't load this content.</Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={() => {
                setFailed(false);
                setLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            key={url}
            source={{ uri: url }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            // onLoadEnd only fires once the page is fully network-idle, which
            // can take a while on heavier sites — reveal as soon as the page
            // is mostly rendered instead of waiting for every last resource.
            onLoadProgress={({ nativeEvent }) => {
              if (nativeEvent.progress > 0.4) {
                setLoading(false);
              }
            }}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            onHttpError={() => {
              setLoading(false);
              setFailed(true);
            }}
            startInLoadingState={false}
          />
        )}

        {loading && !failed && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={THEME.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.cardBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: THEME.headerFrom,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: THEME.cardBg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.cardBg,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: THEME.subtext,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SponsorAdScreen;
