import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';
import { THEME, hexToRgba } from '../theme/colors';

const PACKAGE_NAME = 'com.aryan_raval.EMICalculator';
const STORE_URL = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;

type Props = {
  onBackHome: () => void;
  onOpenLanguage: () => void;
  onOpenConvert: () => void;
  onOpenChart: () => void;
  onOpenCalculator: () => void;
};

type ModalType = 'none' | 'rate' | 'feedback' | 'policy';

const FEEDBACK_TOPICS = ['Calculation', 'UI / UX', 'Performance', 'Language', 'Bug'];

function SettingRow({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingIconWrap}>
        <Icon name={icon as never} size={24} color={THEME.primary} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Icon name="chevron-right" size={22} color={THEME.subtext} />
    </TouchableOpacity>
  );
}

function BottomNav({
  insetBottom,
  onBackHome,
  onOpenConvert,
  onOpenChart,
  onOpenCalculator,
}: Props & { insetBottom: number }) {
  return (
    <View style={[styles.navBar, { paddingBottom: insetBottom }]}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navButton} activeOpacity={0.75} onPress={onBackHome}>
          <Icon name="home-variant-outline" size={22} color={THEME.navInactive} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} activeOpacity={0.75} onPress={onOpenConvert}>
          <Icon name="swap-horizontal-circle-outline" size={22} color={THEME.navInactive} />
          <Text style={styles.navLabel}>Convert</Text>
        </TouchableOpacity>
        <View style={styles.fabSpacer} />
        <TouchableOpacity style={styles.navButton} activeOpacity={0.75} onPress={onOpenChart}>
          <Icon name="chart-box-outline" size={22} color={THEME.navInactive} />
          <Text style={styles.navLabel}>Chart</Text>
        </TouchableOpacity>
        <View style={styles.navButton}>
          <View style={styles.navIconActive}>
            <Icon name="cog-outline" size={21} color={THEME.primary} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Settings</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.fabWrap} activeOpacity={0.85} onPress={onOpenCalculator}>
        <LinearGradient colors={[THEME.headerTo, THEME.headerFrom]} style={styles.fab}>
          <Icon name="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function RateModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [rating, setRating] = useState(0);

  const openStore = async () => {
    const marketUrl = `market://details?id=${PACKAGE_NAME}`;
    const canOpenMarket = await Linking.canOpenURL(marketUrl);
    await Linking.openURL(canOpenMarket ? marketUrl : STORE_URL);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalClose} activeOpacity={0.75} onPress={onClose}>
            <Icon name="close" size={24} color={THEME.subtext} />
          </TouchableOpacity>
          <View style={styles.modalIconHero}>
            <Icon name="star-circle" size={72} color={THEME.gold} />
          </View>
          <Text style={styles.modalTitle}>Your rating matters</Text>
          <Text style={styles.modalText}>
            If the app is useful, rate it on the Play Store. This opens the official store page.
          </Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(value => (
              <TouchableOpacity key={value} activeOpacity={0.8} onPress={() => setRating(value)}>
                <Icon
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={42}
                  color={value <= rating ? THEME.gold : '#C9CFC7'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryButton, rating === 0 && styles.primaryButtonDisabled]}
            disabled={rating === 0}
            onPress={openStore}
          >
            <Text style={styles.primaryButtonText}>Open Play Store</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeedbackModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [topic, setTopic] = useState(FEEDBACK_TOPICS[0]);
  const [message, setMessage] = useState('');

  const sendFeedback = async () => {
    Alert.alert('Thanks', `Feedback received for ${topic}.`);
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAwareScrollView contentContainerStyle={styles.feedbackSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Feedback</Text>
            <TouchableOpacity activeOpacity={0.75} onPress={onClose}>
              <Icon name="close" size={24} color={THEME.subtext} />
            </TouchableOpacity>
          </View>
          <Text style={styles.feedbackQuestion}>What should we improve?</Text>
          <View style={styles.topicGrid}>
            {FEEDBACK_TOPICS.map(item => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                style={[styles.topicChip, topic === item && styles.topicChipActive]}
                onPress={() => setTopic(item)}
              >
                <Text style={[styles.topicText, topic === item && styles.topicTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.feedbackInput}
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Write your feedback here..."
            placeholderTextColor="#A9AEAB"
            textAlignVertical="top"
          />
          <TouchableOpacity activeOpacity={0.85} style={styles.primaryButton} onPress={sendFeedback}>
            <Text style={styles.primaryButtonText}>Send</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}

function PolicyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.policySheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Policy</Text>
            <TouchableOpacity activeOpacity={0.75} onPress={onClose}>
              <Icon name="close" size={24} color={THEME.subtext} />
            </TouchableOpacity>
          </View>
          <Text style={styles.policyText}>
            EMI Studio provides financial calculations for education and planning. Results are
            estimates and should not be treated as financial advice. Live exchange rates may vary by
            provider and market timing.
          </Text>
          <Text style={styles.policyText}>
            The app does not ask for bank passwords, card numbers, or sensitive financial account
            credentials. Feedback and rating actions open user-controlled system experiences.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function SettingsScreen({
  onBackHome,
  onOpenLanguage,
  onOpenConvert,
  onOpenChart,
  onOpenCalculator,
}: Props) {
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState<ModalType>('none');

  const shareApp = async () => {
    await Share.share({
      title: 'EMI Studio',
      message: `Try EMI Studio for loan, investment, and currency tools: ${STORE_URL}`,
    });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[THEME.headerFrom, THEME.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerIcon}>
          <Icon name="cog-outline" size={22} color="#FFFFFF" />
        </View>
      </LinearGradient>

      <View style={styles.contentCard}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Icon name="bank-check" size={30} color={THEME.primary} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>EMI Studio</Text>
            <Text style={styles.summarySubtitle}>Loan, investment, and live currency tools in one clean place.</Text>
          </View>
        </View>

        <View style={styles.settingGroup}>
          <SettingRow icon="translate" label="Languages" onPress={onOpenLanguage} />
          <SettingRow icon="star-outline" label="Rate app" onPress={() => setModal('rate')} />
          <SettingRow icon="message-text-outline" label="Feedback" onPress={() => setModal('feedback')} />
          <SettingRow icon="share-variant-outline" label="Share" onPress={shareApp} />
          <SettingRow icon="file-document-outline" label="Policy" onPress={() => setModal('policy')} />
        </View>

        <View style={styles.infoStrip}>
          <Icon name="shield-check-outline" size={18} color={THEME.primary} />
          <Text style={styles.infoStripText}>No sensitive banking details are required for calculations.</Text>
        </View>
      </View>

      <BottomNav
        insetBottom={insets.bottom}
        onBackHome={onBackHome}
        onOpenLanguage={onOpenLanguage}
        onOpenConvert={onOpenConvert}
        onOpenChart={onOpenChart}
        onOpenCalculator={onOpenCalculator}
      />

      <RateModal visible={modal === 'rate'} onClose={() => setModal('none')} />
      <FeedbackModal visible={modal === 'feedback'} onClose={() => setModal('none')} />
      <PolicyModal visible={modal === 'policy'} onClose={() => setModal('none')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.screenBg },
  header: {
    minHeight: 150,
    paddingHorizontal: 22,
    paddingBottom: 25,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 34, fontWeight: '900', color: '#FFFFFF' },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  contentCard: {
    flex: 1,
    marginTop: -18,
    paddingHorizontal: 18,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    minHeight: 102,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#F7FBF9',
  },
  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(THEME.primary, 0.1),
  },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontSize: 21, fontWeight: '900', color: THEME.text },
  summarySubtitle: { marginTop: 5, fontSize: 13, lineHeight: 18, fontWeight: '700', color: THEME.subtext },
  settingGroup: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#FFFFFF',
  },
  settingRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  settingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(THEME.primary, 0.08),
  },
  settingLabel: { flex: 1, fontSize: 18, fontWeight: '800', color: THEME.text },
  infoStrip: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: hexToRgba(THEME.primary, 0.07),
  },
  infoStripText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '700', color: THEME.subtext },
  navBar: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
    shadowColor: THEME.headerFrom,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
  navButton: { flex: 1, alignItems: 'center', gap: 4 },
  navIconActive: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: hexToRgba(THEME.navActive, 0.12),
  },
  navLabel: { fontSize: 10.5, fontWeight: '700', color: THEME.navInactive },
  navLabelActive: { color: THEME.navActive },
  fabSpacer: { flex: 1 },
  fabWrap: {
    position: 'absolute',
    top: -26,
    alignSelf: 'center',
    borderRadius: 30,
    padding: 4,
    backgroundColor: '#FFFFFF',
    elevation: 6,
  },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.56)',
  },
  modalCard: {
    margin: 16,
    borderRadius: 26,
    padding: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalIconHero: { marginTop: -4 },
  modalTitle: { marginTop: 6, fontSize: 21, fontWeight: '900', color: THEME.text },
  modalText: { marginTop: 10, textAlign: 'center', fontSize: 13.5, lineHeight: 20, color: THEME.subtext },
  starRow: { flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 20 },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: THEME.primary,
  },
  primaryButtonDisabled: { backgroundColor: '#A8AAA8' },
  primaryButtonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  feedbackSheet: {
    marginTop: 'auto',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 23, fontWeight: '900', color: THEME.text },
  feedbackQuestion: { marginTop: 20, fontSize: 17, fontWeight: '900', color: THEME.text },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  topicChip: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: THEME.border,
    backgroundColor: '#FFFFFF',
  },
  topicChipActive: { borderColor: THEME.primary, backgroundColor: hexToRgba(THEME.primary, 0.08) },
  topicText: { fontSize: 13.5, fontWeight: '800', color: THEME.subtext },
  topicTextActive: { color: THEME.primary },
  feedbackInput: {
    minHeight: 170,
    marginTop: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: THEME.text,
    backgroundColor: '#FAFCFC',
  },
  policySheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  policyText: { marginTop: 16, fontSize: 14, lineHeight: 21, fontWeight: '600', color: THEME.subtext },
});

export default SettingsScreen;
