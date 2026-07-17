import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

type CustomAdModalProps = {
  visible: boolean;
  url: string;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  // 'ad' = the custom_link house ad (SPONSORED badge, CTA opens the link).
  // 'message' = the home_popup announcement (no badge, CTA just dismisses).
  variant?: 'ad' | 'message';
};

// A full-screen modal used two ways, selected by `variant`:
//  - 'ad': the click/back-cadence custom_link house ad, and
//  - 'message': the home_popup announcement (title/subtitle from Remote Config).
function CustomAdModal({
  visible,
  url,
  onClose,
  title,
  subtitle,
  ctaText,
  variant = 'ad',
}: CustomAdModalProps) {
  const isMessage = variant === 'message';

  const onCtaPress = () => {
    if (!isMessage && url) {
      Linking.openURL(url).catch(() => undefined);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color="#64748B" />
          </TouchableOpacity>

          {isMessage ? null : (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SPONSORED</Text>
            </View>
          )}

          <View style={[styles.iconCircle, isMessage && styles.iconCircleMessage]}>
            <Icon name={isMessage ? 'bell-ring-outline' : 'star-four-points'} size={40} color="#0E9F6E" />
          </View>

          <Text style={styles.title}>{title || 'Check this out'}</Text>
          <Text style={styles.subtitle}>
            {subtitle || 'A quick pick handpicked for you.'}
          </Text>

          <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={onCtaPress}>
            <Text style={styles.ctaText}>
              {ctaText || (isMessage ? 'Got it' : 'Learn More')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  badge: {
    backgroundColor: 'rgba(14,159,110,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#0E9F6E',
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(14,159,110,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleMessage: {
    marginTop: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 22,
  },
  cta: {
    backgroundColor: '#0E9F6E',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CustomAdModal;
