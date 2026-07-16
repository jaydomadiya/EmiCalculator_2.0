import { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { CurrencyBadge, getSelectionMeta } from '../components/CurrencyBadge';
import { CRYPTO_CURRENCIES } from '../data/cryptoCurrencies';
import { CURRENCIES } from '../data/currencies';
import { useCombinedRates } from '../hooks/useCombinedRates';
import { THEME, hexToRgba } from '../theme/colors';
import { CurrencyKind } from '../utils/conversion';
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

type ListEntry = {
  code: string;
  kind: CurrencyKind;
  name: string;
  value: number | null;
};

const PAGE_SIZE = 40;
const ROW_HEIGHT = 68;
const ROW_SPACING = 10;
const ROW_EXTENT = ROW_HEIGHT + ROW_SPACING;

const CurrencyListRow = memo(function CurrencyListRow({
  item,
  isLoading,
}: {
  item: ListEntry;
  isLoading: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowBadge}>
        <CurrencyBadge selection={{ code: item.code, kind: item.kind }} size={24} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowCode}>{item.code}</Text>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue} numberOfLines={1}>
          {isLoading && item.value === null
            ? '…'
            : item.value !== null
              ? (item.kind === 'crypto' ? '$' : '') + formatAmount(item.value)
              : '--'}
        </Text>
        <Text style={styles.rowValueLabel}>{item.kind === 'crypto' ? 'USDT' : 'per USD'}</Text>
      </View>
    </View>
  );
});

type Props = {
  onBack: () => void;
};

function CurrencyListScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [page, setPage] = useState(1);

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

  const isAnyOffline = isFiatOffline || isCryptoOffline;

  const entries: ListEntry[] = useMemo(() => {
    const fiatCodes = (fiatRates ? Object.keys(fiatRates) : CURRENCIES.map(c => c.code)).sort();
    const fiatEntries: ListEntry[] = fiatCodes.map(code => ({
      code,
      kind: 'fiat',
      name: getSelectionMeta({ code, kind: 'fiat' }).name,
      value: fiatRates?.[code] ?? null,
    }));

    const cryptoCodes = (
      cryptoRates ? Object.keys(cryptoRates) : CRYPTO_CURRENCIES.map(c => c.symbol)
    ).sort();
    const cryptoEntries: ListEntry[] = cryptoCodes.map(code => ({
      code,
      kind: 'crypto',
      name: getSelectionMeta({ code, kind: 'crypto' }).name,
      value: cryptoRates?.[code] ?? null,
    }));

    let combined: ListEntry[];
    if (tab === 'fiat') {
      combined = fiatEntries;
    } else if (tab === 'crypto') {
      combined = cryptoEntries;
    } else {
      combined = [...fiatEntries, ...cryptoEntries].sort((a, b) => a.code.localeCompare(b.code));
    }

    const q = query.trim().toLowerCase();
    if (!q) {
      return combined;
    }
    return combined.filter(
      item => item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
    );
  }, [fiatRates, cryptoRates, tab, query]);

  useEffect(() => {
    setPage(1);
  }, [tab, query]);

  const visibleEntries = useMemo(
    () => entries.slice(0, page * PAGE_SIZE),
    [entries, page],
  );
  const hasMore = visibleEntries.length < entries.length;

  const handleEndReached = () => {
    if (hasMore) {
      setPage(current => current + 1);
    }
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
          name="format-list-bulleted-square"
          size={128}
          color="rgba(255,255,255,0.06)"
          style={styles.headerWatermark}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Currency List</Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={[styles.body, { paddingBottom: insets.bottom }]}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={18} color={COLORS.subtext} />
          <TextInput
            style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search currency or coin"
          placeholderTextColor={COLORS.subtext}
          autoCorrect={false}
          returnKeyType="search"
        />
        </View>

        <View style={styles.tabRow}>
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'fiat', label: 'Currency' },
              { key: 'crypto', label: 'Crypto' },
            ] as const
          ).map(option => (
            <TouchableOpacity
              key={option.key}
              style={[styles.tabButton, tab === option.key && styles.tabButtonActive]}
              activeOpacity={0.8}
              onPress={() => setTab(option.key)}
            >
              <Text style={[styles.tabButtonText, tab === option.key && styles.tabButtonTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
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

        <FlatList
          data={visibleEntries}
          extraData={isLoading}
          keyExtractor={item => `${item.kind}-${item.code}`}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 72 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => <CurrencyListRow item={item} isLoading={isLoading} />}
          getItemLayout={(_, index) => ({
            length: ROW_EXTENT,
            offset: ROW_EXTENT * index,
            index,
          })}
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No currency or coin matches your search.</Text>
          }
          ListFooterComponent={
            entries.length > 0 ? (
              <>
                {hasMore && (
                  <ActivityIndicator color={COLORS.primary} style={styles.loadMoreSpinner} />
                )}
                <Text style={styles.updatedText}>
                  {fiatUpdatedAt
                    ? `Updated ${formatUpdatedAt(fiatUpdatedAt)}`
                    : isFiatOffline
                      ? 'Offline reference rates'
                      : 'Fetching latest rates…'}
                </Text>
                <Text style={styles.disclaimerText}>
                  Values are indicative reference rates and may differ from real-time market,
                  bank, or exchange rates.
                </Text>
              </>
            ) : null
          }
        />
      </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  keyboardAvoider: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#EFEDE4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.subtext,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: hexToRgba(COLORS.gold, 0.1),
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ROW_HEIGHT,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: ROW_SPACING,
  },
  rowBadge: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowCode: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowName: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  rowValueWrap: {
    alignItems: 'flex-end',
  },
  rowValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  rowValueLabel: {
    fontSize: 10.5,
    color: COLORS.subtext,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.subtext,
    marginTop: 40,
    fontSize: 13,
  },
  loadMoreSpinner: {
    marginVertical: 12,
  },
  updatedText: {
    fontSize: 12,
    color: COLORS.subtext,
    textAlign: 'center',
    marginTop: 8,
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

export default CurrencyListScreen;
