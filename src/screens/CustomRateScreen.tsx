import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { CurrencyBadge, getSelectionMeta } from '../components/CurrencyBadge';
import CurrencyPickerModal from '../components/CurrencyPickerModal';
import { CRYPTO_CURRENCIES } from '../data/cryptoCurrencies';
import { CURRENCIES } from '../data/currencies';
import { useCombinedRates } from '../hooks/useCombinedRates';
import { THEME, hexToRgba } from '../theme/colors';
import { CurrencySelection, convertBetween } from '../utils/conversion';
import { formatAmount } from '../utils/format';

const COLORS = {
  headerFrom: THEME.headerFrom,
  headerTo: THEME.headerTo,
  screenBg: THEME.screenBg,
  cardBg: THEME.cardBg,
  text: THEME.text,
  subtext: THEME.subtext,
  border: THEME.border,
  primary: THEME.primary,
  danger: '#C25454',
};

type Props = {
  onBack: () => void;
};

function CustomRateScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();

  const [fromSelection, setFromSelection] = useState<CurrencySelection>({ code: 'INR', kind: 'fiat' });
  const [toSelection, setToSelection] = useState<CurrencySelection>({ code: 'USD', kind: 'fiat' });
  const [pickerFor, setPickerFor] = useState<'from' | 'to' | null>(null);

  const [customRate, setCustomRate] = useState<number | null>(null);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateDraft, setRateDraft] = useState('');

  const [amount, setAmount] = useState('1');

  const { fiatRates, cryptoRates, isFiatOffline, isCryptoOffline, isLoading } = useCombinedRates();

  const fiatCodes = useMemo(() => {
    const codes = fiatRates ? Object.keys(fiatRates) : CURRENCIES.map(c => c.code);
    return codes.sort();
  }, [fiatRates]);

  const cryptoCodes = useMemo(() => {
    const codes = cryptoRates ? Object.keys(cryptoRates) : CRYPTO_CURRENCIES.map(c => c.symbol);
    return codes.sort();
  }, [cryptoRates]);

  const liveRate = convertBetween(1, fromSelection, toSelection, fiatRates, cryptoRates);
  const activeRate = customRate ?? liveRate;

  const fromMeta = getSelectionMeta(fromSelection);
  const toMeta = getSelectionMeta(toSelection);

  const numericAmount = Number(amount.replace(/[^0-9.]/g, '')) || 0;
  const convertedAmount = activeRate !== null ? numericAmount * activeRate : null;

  const handleSwap = () => {
    setFromSelection(toSelection);
    setToSelection(fromSelection);
    setCustomRate(current => (current && current > 0 ? 1 / current : null));
  };

  const handleStartEditRate = () => {
    setRateDraft(activeRate !== null ? String(activeRate) : '');
    setIsEditingRate(true);
  };

  const handleSaveRate = () => {
    const parsed = Number(rateDraft);
    if (Number.isFinite(parsed) && parsed > 0) {
      setCustomRate(parsed);
    }
    setIsEditingRate(false);
  };

  const handleReset = () => {
    setCustomRate(null);
    setIsEditingRate(false);
  };

  const isCustomActive = customRate !== null;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Icon
          name="percent-outline"
          size={128}
          color="rgba(255,255,255,0.06)"
          style={styles.headerWatermark}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Custom Rate</Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <KeyboardAwareScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
          extraKeyboardSpace={34}
        >
          <View style={styles.rateCard}>
            <View style={styles.rateCardTopRow}>
              <Text style={styles.rateCardLabel}>Exchange Rate</Text>
              {isCustomActive && (
                <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingRate ? (
              <View style={styles.rateEditRow}>
                <Text style={styles.rateEditPrefix}>1 {fromMeta.code} =</Text>
                <TextInput
                  style={styles.rateEditInput}
                  value={rateDraft}
                  onChangeText={text => setRateDraft(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.subtext}
                  autoFocus
                />
                <Text style={styles.rateEditSuffix}>{toMeta.code}</Text>
              </View>
            ) : (
              <Text style={styles.rateValueText}>
                1 {fromMeta.code} ={' '}
                <Text style={isCustomActive ? styles.rateValueCustom : styles.rateValueLive}>
                  {activeRate !== null ? formatAmount(activeRate) : '--'}
                </Text>{' '}
                {toMeta.code}
              </Text>
            )}

            {liveRate !== null && (
              <Text style={styles.liveRateText}>
                Live rate: 1 {fromMeta.code} = {formatAmount(liveRate)} {toMeta.code}
              </Text>
            )}

            {isEditingRate ? (
              <View style={styles.editActionsRow}>
                <TouchableOpacity
                  style={[styles.changeRateButton, styles.cancelButton]}
                  activeOpacity={0.85}
                  onPress={() => setIsEditingRate(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.changeRateButton, styles.saveButton]}
                  activeOpacity={0.85}
                  onPress={handleSaveRate}
                >
                  <Text style={styles.changeRateButtonText}>Save Rate</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.changeRateButton}
                activeOpacity={0.85}
                onPress={handleStartEditRate}
              >
                <Text style={styles.changeRateButtonText}>CHANGE RATE</Text>
              </TouchableOpacity>
            )}
          </View>

          {(isFiatOffline || isCryptoOffline) && (
            <View style={styles.noticeCard}>
              <Icon name="wifi-off" size={18} color={THEME.gold} />
              <Text style={styles.noticeText}>
                You're offline — showing bundled reference rates for the live comparison.
              </Text>
            </View>
          )}

          <View style={styles.pairRow}>
            <TouchableOpacity
              style={styles.pairPill}
              activeOpacity={0.75}
              onPress={() => setPickerFor('from')}
            >
              <CurrencyBadge selection={fromSelection} size={18} />
              <Text style={styles.pairPillText}>{fromMeta.code}</Text>
              <Icon name="chevron-down" size={16} color={COLORS.subtext} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapButton} activeOpacity={0.8} onPress={handleSwap}>
              <Icon name="swap-horizontal" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pairPill}
              activeOpacity={0.75}
              onPress={() => setPickerFor('to')}
            >
              <CurrencyBadge selection={toSelection} size={18} />
              <Text style={styles.pairPillText}>{toMeta.code}</Text>
              <Icon name="chevron-down" size={16} color={COLORS.subtext} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountCard}>
            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>Amount</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.subtext}
              />
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>Converted Amount</Text>
              <Text style={styles.convertedValue} numberOfLines={1}>
                {isLoading ? '…' : convertedAmount !== null ? formatAmount(convertedAmount) : '--'}
              </Text>
            </View>
          </View>

          <Text style={styles.disclaimerText}>
            A custom rate overrides the live rate for this pair only, on this device. It is not
            shared, saved to a server, or used elsewhere in the app — for reference and planning
            purposes only.
          </Text>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      <CurrencyPickerModal
        visible={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        allowedKinds={['fiat', 'crypto']}
        fiatCodes={fiatCodes}
        cryptoCodes={cryptoCodes}
        disabledSelections={[pickerFor === 'from' ? toSelection : fromSelection]}
        onSelect={selection => {
          setCustomRate(null);
          if (pickerFor === 'from') {
            setFromSelection(selection);
          } else if (pickerFor === 'to') {
            setToSelection(selection);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerWatermark: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  body: {
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  rateCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  rateCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rateCardLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.4,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  rateValueText: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
  },
  rateValueLive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  rateValueCustom: {
    color: THEME.gold,
    fontWeight: '800',
  },
  rateEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rateEditPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  rateEditInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
  },
  rateEditSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  liveRateText: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 6,
    marginBottom: 16,
  },
  changeRateButton: {
    backgroundColor: COLORS.headerFrom,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  changeRateButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: hexToRgba(THEME.gold, 0.1),
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  pairPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pairPillText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  swapButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 16,
    padding: 18,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    padding: 0,
  },
  convertedValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  amountDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 18,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 8,
  },
});

export default CustomRateScreen;
