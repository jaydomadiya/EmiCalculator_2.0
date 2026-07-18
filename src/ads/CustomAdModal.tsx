import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

type CustomAdModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  ctaText?: string;
};

// The home_popup announcement modal (title/subtitle from Remote Config).
// CTA just dismisses — it never navigates anywhere.
function CustomAdModal({ visible, onClose, title, subtitle, ctaText }: CustomAdModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Icon name="bell-ring-outline" size={40} color="#0E9F6E" />
          </View>

          <Text style={styles.title}>{title || 'Check this out'}</Text>
          <Text style={styles.subtitle}>
            {subtitle || 'A quick pick handpicked for you.'}
          </Text>

          <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={onClose}>
            <Text style={styles.ctaText}>{ctaText || 'Got it'}</Text>
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
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(14,159,110,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
