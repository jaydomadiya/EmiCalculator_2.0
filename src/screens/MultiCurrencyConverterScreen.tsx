import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyBadge, getSelectionMeta } from '../components/CurrencyBadge';
import CurrencyPickerModal from '../components/CurrencyPickerModal';
import { CRYPTO_CURRENCIES } from '../data/cryptoCurrencies';
import { CURRENCIES } from '../data/currencies';
import { useCombinedRates } from '../hooks/useCombinedRates';
import { THEME, hexToRgba } from '../theme/colors';
import { CurrencyKind, CurrencySelection, convertBetween, sameSelection } from '../utils/conversion';
import { formatAmount, formatUpdatedAt } from '../utils/format';

const COLORS = {
  headerFrom: THEME.headerFrom,
  headerTo: THEME.headerTo,
  screenBg: THEME.screenBg,
  cardBg: THEME.cardBg,
  text: THEME.text,
  subtext: THEME.subtext,
  border: THEME.border,
  gold: THEME.gold,
  primary: THEME.primary,
};

type PickerMode = { type: 'base' } | { type: 'add' } | { type: 'edit'; index: number };

export type MultiCurrencyConverterScreenProps = {
  title: string;
  headerIcon?: string;
  allowedKinds: CurrencyKind[];
  defaultBase: CurrencySelection;
  defaultTargets: CurrencySelection[];
  addButtonLabel?: string;
  onBack: () => void;
};

function MultiCurrencyConverterScreen({
  title,
  headerIcon = 'cash-multiple',
  allowedKinds,
  defaultBase,
  defaultTargets,
  addButtonLabel = 'Add Currency',
  onBack,
}: MultiCurrencyConverterScreenProps) {
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('1');
  const [baseSelection, setBaseSelection] = useState<CurrencySelection>(defaultBase);
  const [targets, setTargets] = useState<CurrencySelection[]>(defaultTargets);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);

  const {
    fiatRates,
    cryptoRates,
    fiatUpdatedAt,
    isFiatOffline,
    isCryptoOffline,
    isLoading,
    reloadFiat,
    reloadCrypto,
  } = useCombinedRates();

  const isAnyOffline =
    (allowedKinds.includes('fiat') && isFiatOffline) ||
    (allowedKinds.includes('crypto') && isCryptoOffline);

  const fiatCodes = useMemo(() => {
    if (!allowedKinds.includes('fiat')) {
      return [];
    }
    const codes = fiatRates ? Object.keys(fiatRates) : CURRENCIES.map(c => c.code);
    return codes.sort();
  }, [allowedKinds, fiatRates]);

  const cryptoCodes = useMemo(() => {
    if (!allowedKinds.includes('crypto')) {
      return [];
    }
    const codes = cryptoRates ? Object.keys(cryptoRates) : CRYPTO_CURRENCIES.map(c => c.symbol);
    return codes.sort();
  }, [allowedKinds, cryptoRates]);

  const numericAmount = Number(amount.replace(/[^0-9.]/g, '')) || 0;
  const baseMeta = getSelectionMeta(baseSelection);

  const handleSelectFromPicker = (selection: CurrencySelection) => {
    if (!pickerMode) {
      return;
    }
    if (pickerMode.type === 'base') {
      setBaseSelection(selection);
      setTargets(current => current.filter(t => !sameSelection(t, selection)));
    } else if (pickerMode.type === 'add') {
      if (sameSelection(selection, baseSelection) || targets.some(t => sameSelection(t, selection))) {
        return;
      }
      setTargets(current => [...current, selection]);
    } else if (pickerMode.type === 'edit') {
      const index = pickerMode.index;
      const conflict =
        sameSelection(selection, baseSelection) ||
        targets.some((t, i) => i !== index && sameSelection(t, selection));
      if (conflict) {
        return;
      }
      setTargets(current => current.map((t, i) => (i === index ? selection : t)));
    }
  };

  const disabledSelections = useMemo(() => {
    if (pickerMode?.type === 'edit') {
      return [baseSelection, ...targets.filter((_, i) => i !== pickerMode.index)];
    }
    return [baseSelection, ...targets];
  }, [pickerMode, baseSelection, targets]);

  const handleRemoveTarget = (index: number) => {
    setTargets(current => current.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Icon
          name={headerIcon as never}
          size={128}
          color="rgba(255,255,255,0.06)"
          style={styles.headerWatermark}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <FlatList
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        data={targets}
        keyExtractor={(item, index) => `${item.kind}-${item.code}-${index}`}
        ListHeaderComponent={
          <>
            <View style={styles.baseCard}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.subtext}
                />
                <TouchableOpacity
                  style={styles.currencyPill}
                  activeOpacity={0.75}
                  onPress={() => setPickerMode({ type: 'base' })}
                >
                  <CurrencyBadge selection={baseSelection} size={18} />
                  <Text style={styles.currencyPillCode}>{baseMeta.code}</Text>
                  <Icon name="chevron-down" size={16} color={COLORS.subtext} />
                </TouchableOpacity>
              </View>
              <Text style={styles.currencyName}>{baseMeta.name}</Text>
            </View>

            {isAnyOffline && (
              <View style={styles.noticeCard}>
                <Icon name="wifi-off" size={18} color={COLORS.gold} />
                <Text style={styles.noticeText}>
                  {isFiatOffline && isCryptoOffline
                    ? "You're offline — showing bundled reference rates."
                    : isFiatOffline
                      ? 'Currency rates are offline — showing bundled reference rates.'
                      : 'Crypto prices are offline — showing bundled reference prices.'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isFiatOffline) reloadFiat();
                    if (isCryptoOffline) reloadCrypto();
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {targets.length > 0 && <Text style={styles.sectionLabel}>Converted To</Text>}
          </>
        }
        renderItem={({ item, index }) => {
          const converted = convertBetween(numericAmount, baseSelection, item, fiatRates, cryptoRates);
          const unitRate = convertBetween(1, baseSelection, item, fiatRates, cryptoRates);
          const meta = getSelectionMeta(item);

          return (
            <View style={styles.targetCard}>
              <TouchableOpacity
                style={styles.targetTopRow}
                activeOpacity={0.75}
                onPress={() => setPickerMode({ type: 'edit', index })}
              >
                <View style={styles.targetBadgeWrap}>
                  <CurrencyBadge selection={item} size={22} />
                </View>
                <View style={styles.targetTextWrap}>
                  <Text style={styles.targetCode}>{meta.code}</Text>
                  <Text style={styles.targetName} numberOfLines={1}>
                    {meta.name}
                  </Text>
                </View>
                <Icon name="chevron-down" size={18} color={COLORS.subtext} />
                <TouchableOpacity
                  style={styles.removeButton}
                  activeOpacity={0.7}
                  onPress={() => handleRemoveTarget(index)}
                >
                  <Icon name="close-circle" size={20} color={COLORS.subtext} />
                </TouchableOpacity>
              </TouchableOpacity>

              {isLoading ? (
                <ActivityIndicator color={COLORS.primary} style={styles.targetLoading} />
              ) : (
                <Text style={styles.targetValue} numberOfLines={1}>
                  {converted !== null ? formatAmount(converted) : '--'}
                </Text>
              )}
              {unitRate !== null && (
                <Text style={styles.rateText}>
                  1 {baseMeta.code} = {formatAmount(unitRate)} {meta.code}
                </Text>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.8}
              onPress={() => setPickerMode({ type: 'add' })}
            >
              <Icon name="plus-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addButtonText}>{addButtonLabel}</Text>
            </TouchableOpacity>

            <Text style={styles.updatedText}>
              {fiatUpdatedAt
                ? `Updated ${formatUpdatedAt(fiatUpdatedAt)}`
                : isFiatOffline
                  ? 'Offline reference rates'
                  : 'Fetching latest rates…'}
            </Text>
            <Text style={styles.disclaimerText}>
              Exchange rates and crypto prices are indicative and may differ from real-time
              market, bank, or exchange rates. For reference only — not intended for trading or
              financial decisions.
            </Text>
          </>
        }
      />

      <CurrencyPickerModal
        visible={pickerMode !== null}
        onClose={() => setPickerMode(null)}
        onSelect={handleSelectFromPicker}
        disabledSelections={disabledSelections}
        allowedKinds={allowedKinds}
        fiatCodes={fiatCodes}
        cryptoCodes={cryptoCodes}
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
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  baseCard: {
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
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    padding: 0,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: hexToRgba(COLORS.primary, 0.08),
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currencyPillCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  currencyName: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 4,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: hexToRgba(COLORS.gold, 0.1),
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
  retryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.4,
    marginTop: 20,
    marginBottom: 10,
  },
  targetCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  targetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  targetBadgeWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTextWrap: {
    flex: 1,
  },
  targetCode: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  targetName: {
    fontSize: 11.5,
    color: COLORS.subtext,
  },
  removeButton: {
    padding: 4,
  },
  targetValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  targetLoading: {
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  rateText: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: hexToRgba(COLORS.primary, 0.35),
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  updatedText: {
    fontSize: 12,
    color: COLORS.subtext,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 8,
  },
});

export default MultiCurrencyConverterScreen;
