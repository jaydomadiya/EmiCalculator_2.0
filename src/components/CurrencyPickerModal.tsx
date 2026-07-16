import { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { getCryptoMeta } from '../data/cryptoCurrencies';
import { getCurrencyMeta } from '../data/currencies';
import { THEME } from '../theme/colors';
import { CurrencyKind, CurrencySelection } from '../utils/conversion';
import { CurrencyBadge } from './CurrencyBadge';

const COLORS = {
  text: THEME.text,
  subtext: THEME.subtext,
  border: THEME.border,
  screenBg: THEME.screenBg,
  primary: THEME.primary,
};

type ListEntry = {
  code: string;
  kind: CurrencyKind;
  name: string;
};

const PAGE_SIZE = 40;
const ROW_HEIGHT = 56;

const PickerRow = memo(function PickerRow({
  item,
  isDisabled,
  onPress,
}: {
  item: ListEntry;
  isDisabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.modalRow, isDisabled && styles.modalRowDisabled]}
      activeOpacity={isDisabled ? 1 : 0.7}
      disabled={isDisabled}
      onPress={onPress}
    >
      <View style={styles.modalRowBadge}>
        <CurrencyBadge selection={{ code: item.code, kind: item.kind }} size={22} />
      </View>
      <View style={styles.modalRowTextWrap}>
        <Text style={styles.modalRowCode}>{item.code}</Text>
        <Text style={styles.modalRowName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      {isDisabled && <Text style={styles.modalRowAddedTag}>Added</Text>}
    </TouchableOpacity>
  );
});

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (selection: CurrencySelection) => void;
  disabledSelections?: CurrencySelection[];
  allowedKinds: CurrencyKind[];
  fiatCodes: string[];
  cryptoCodes: string[];
};

function CurrencyPickerModal({
  visible,
  title = 'Select Currency',
  onClose,
  onSelect,
  disabledSelections = [],
  allowedKinds,
  fiatCodes,
  cryptoCodes,
}: Props) {
  const [query, setQuery] = useState('');
  const showTabs = allowedKinds.length > 1;
  const [tab, setTab] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [page, setPage] = useState(1);

  const entries: ListEntry[] = useMemo(() => {
    const fiatEntries: ListEntry[] = allowedKinds.includes('fiat')
      ? fiatCodes.map(code => {
          const meta = getCurrencyMeta(code);
          return { code, kind: 'fiat' as const, name: meta.name };
        })
      : [];
    const cryptoEntries: ListEntry[] = allowedKinds.includes('crypto')
      ? cryptoCodes.map(code => ({ code, kind: 'crypto' as const, name: getCryptoMeta(code).name }))
      : [];

    let combined: ListEntry[];
    if (!showTabs) {
      combined = [...fiatEntries, ...cryptoEntries];
    } else if (tab === 'fiat') {
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
  }, [allowedKinds, fiatCodes, cryptoCodes, showTabs, tab, query]);

  useEffect(() => {
    setPage(1);
  }, [tab, query, visible]);

  const visibleEntries = useMemo(() => entries.slice(0, page * PAGE_SIZE), [entries, page]);
  const hasMore = visibleEntries.length < entries.length;

  const handleEndReached = () => {
    if (hasMore) {
      setPage(current => current + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.modalCloseButton}>
              <Icon name="close" size={20} color={COLORS.subtext} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Icon name="magnify" size={18} color={COLORS.subtext} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search currency or coin"
              placeholderTextColor={COLORS.subtext}
              autoCorrect={false}
            />
          </View>

          {showTabs && (
            <View style={styles.tabRow}>
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'fiat', label: 'Currencies' },
                  { key: 'crypto', label: 'Crypto' },
                ] as const
              ).map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.tabButton, tab === option.key && styles.tabButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setTab(option.key)}
                >
                  <Text
                    style={[styles.tabButtonText, tab === option.key && styles.tabButtonTextActive]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FlatList
            data={visibleEntries}
            keyExtractor={item => `${item.kind}-${item.code}`}
            style={styles.modalList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isDisabled = disabledSelections.some(
                sel => sel.code === item.code && sel.kind === item.kind,
              );
              return (
                <PickerRow
                  item={item}
                  isDisabled={isDisabled}
                  onPress={() => {
                    onSelect({ code: item.code, kind: item.kind });
                    setQuery('');
                    onClose();
                  }}
                />
              );
            }}
            getItemLayout={(_, index) => ({
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * index,
              index,
            })}
            initialNumToRender={16}
            maxToRenderPerBatch={16}
            windowSize={7}
            removeClippedSubviews
            onEndReachedThreshold={0.4}
            onEndReached={handleEndReached}
            ListEmptyComponent={
              <Text style={styles.modalEmptyText}>No currency or coin matches your search.</Text>
            }
            ListFooterComponent={
              hasMore ? <ActivityIndicator color={COLORS.primary} style={styles.loadMoreSpinner} /> : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    height: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: COLORS.screenBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.subtext,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  modalList: {
    flex: 1,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  loadMoreSpinner: {
    marginVertical: 12,
  },
  modalRowDisabled: {
    opacity: 0.45,
  },
  modalRowBadge: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRowTextWrap: {
    flex: 1,
  },
  modalRowCode: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalRowName: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  modalRowAddedTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalEmptyText: {
    textAlign: 'center',
    color: COLORS.subtext,
    marginTop: 40,
    fontSize: 13,
  },
});

export default CurrencyPickerModal;
