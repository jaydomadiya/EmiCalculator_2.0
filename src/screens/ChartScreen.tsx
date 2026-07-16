import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME, hexToRgba } from '../theme/colors';
import { InvestmentCurrency } from '../types/investment';
import { convertAmount, FALLBACK_RATES_USD, fetchLiveRates } from '../utils/currencyRates';
import { INVESTMENT_CURRENCIES } from '../utils/investment';

type Props = {
  onBackHome: () => void;
  onOpenConvert: () => void;
  onOpenCalculator: () => void;
  onOpenSettings: () => void;
};

type RangeKey = '7D' | '30D' | '90D';
type CurrencyMenuKey = 'from' | 'to' | null;

type ChartPoint = {
  date: string;
  value: number;
};

const HISTORICAL_API = 'https://api.frankfurter.app';
const CHART_HEIGHT = 230;
const CHART_WIDTH_PERCENT = 100;
const RANGES: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: '7D', label: '7 Days', days: 7 },
  { key: '30D', label: '30 Days', days: 30 },
  { key: '90D', label: '90 Days', days: 90 },
];

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

function formatRate(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  if (value < 0.01) {
    return value.toFixed(6);
  }
  if (value < 1) {
    return value.toFixed(4);
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function currencyByCode(code: string): InvestmentCurrency {
  return INVESTMENT_CURRENCIES.find(currency => currency.code === code) ?? INVESTMENT_CURRENCIES[0];
}

async function fetchHistoricalRates(
  from: string,
  to: string,
  days: number,
): Promise<ChartPoint[]> {
  if (from === to) {
    const today = new Date();
    return Array.from({ length: Math.min(days, 7) }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (Math.min(days, 7) - index - 1));
      return { date: isoDate(date), value: 1 };
    });
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const url = `${HISTORICAL_API}/${isoDate(start)}..${isoDate(end)}?from=${from}&to=${to}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Historical rates unavailable (${response.status})`);
  }
  const data = await response.json();
  const rates = data?.rates as Record<string, Record<string, number>> | undefined;
  if (!rates) {
    throw new Error('Historical rates unavailable');
  }

  return Object.keys(rates)
    .sort()
    .map(date => ({ date, value: rates[date]?.[to] }))
    .filter(point => Number.isFinite(point.value));
}

function CurrencyPill({
  currency,
  onPress,
}: {
  currency: InvestmentCurrency;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.currencyPill} onPress={onPress}>
      <Text style={styles.flag}>{currency.flag}</Text>
      <Text style={styles.currencyCode}>{currency.code}</Text>
      <Icon name="chevron-down" size={18} color={THEME.subtext} />
    </TouchableOpacity>
  );
}

function CurrencySelector({
  selectedCode,
  onSelect,
  open,
  onToggle,
  align = 'left',
}: {
  selectedCode: string;
  onSelect: (code: string) => void;
  open: boolean;
  onToggle: () => void;
  align?: 'left' | 'right';
}) {
  const selected = currencyByCode(selectedCode);

  return (
    <View style={styles.selectorWrap}>
      <CurrencyPill currency={selected} onPress={onToggle} />
      {open && (
        <View style={[styles.selectorMenu, align === 'right' && styles.selectorMenuRight]}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.selectorScroll}
          >
            {INVESTMENT_CURRENCIES.map(currency => (
              <TouchableOpacity
                key={currency.code}
                activeOpacity={0.75}
                style={[
                  styles.selectorItem,
                  currency.code === selectedCode && styles.selectorItemActive,
                ]}
                onPress={() => {
                  onSelect(currency.code);
                }}
              >
                <Text style={styles.selectorFlag}>{currency.flag}</Text>
                <View style={styles.selectorCopy}>
                  <Text style={styles.selectorName}>{currency.name}</Text>
                  <Text style={styles.selectorCountry}>{currency.country}</Text>
                </View>
                <Text style={styles.selectorCode}>{currency.code}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function SimpleChart({ points }: { points: ChartPoint[] }) {
  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.000001);
  const bars = points.slice(-32);

  return (
    <View style={styles.chartBox}>
      <View style={styles.chartGridLine} />
      <View style={[styles.chartGridLine, { top: '50%' }]} />
      <View style={[styles.chartGridLine, { top: '78%' }]} />
      <View style={styles.barRow}>
        {bars.map(point => {
          const ratio = (point.value - min) / span;
          const height = 22 + ratio * (CHART_HEIGHT - 54);
          return (
            <View key={point.date} style={styles.barColumn}>
              <LinearGradient
                colors={[THEME.primary, 'rgba(20,92,66,0.14)']}
                style={[styles.chartBar, { height }]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.chartLabels}>
        <Text style={styles.chartAxisLabel}>{shortDate(bars[0]?.date ?? '')}</Text>
        <Text style={styles.chartAxisLabel}>{shortDate(bars[Math.floor(bars.length / 2)]?.date ?? '')}</Text>
        <Text style={styles.chartAxisLabel}>{shortDate(bars[bars.length - 1]?.date ?? '')}</Text>
      </View>
    </View>
  );
}

function BottomNav({
  insetBottom,
  onBackHome,
  onOpenConvert,
  onOpenCalculator,
  onOpenSettings,
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
        <View style={styles.navButton}>
          <View style={styles.navIconActive}>
            <Icon name="chart-box-outline" size={21} color={THEME.primary} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Chart</Text>
        </View>
        <TouchableOpacity style={styles.navButton} activeOpacity={0.75} onPress={onOpenSettings}>
          <Icon name="cog-outline" size={22} color={THEME.navInactive} />
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.fabWrap} activeOpacity={0.85} onPress={onOpenCalculator}>
        <LinearGradient colors={[THEME.headerTo, THEME.headerFrom]} style={styles.fab}>
          <Icon name="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function ChartScreen({ onBackHome, onOpenConvert, onOpenCalculator, onOpenSettings }: Props) {
  const insets = useSafeAreaInsets();
  const [fromCode, setFromCode] = useState('INR');
  const [toCode, setToCode] = useState('USD');
  const [openMenu, setOpenMenu] = useState<CurrencyMenuKey>(null);
  const [range, setRange] = useState<RangeKey>('7D');
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState('');
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const rangeConfig = RANGES.find(item => item.key === range) ?? RANGES[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const ratesResult = await fetchLiveRates().catch(() => ({
        rates: FALLBACK_RATES_USD,
        updatedAt: '',
        isLive: false,
      }));
      const currentRate = convertAmount(1, fromCode, toCode, ratesResult.rates);
      setLiveRate(currentRate);
      setLiveUpdatedAt(ratesResult.isLive ? ratesResult.updatedAt : 'Offline reference rates');

      try {
        const history = await fetchHistoricalRates(fromCode, toCode, rangeConfig.days);
        setPoints(history);
      } catch (historyError) {
        setPoints([]);
        setError('Historical chart is unavailable for this pair. Latest live rate is still shown.');
      }
    } finally {
      setLoading(false);
    }
  }, [fromCode, rangeConfig.days, toCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changePercent = useMemo(() => {
    if (points.length < 2) {
      return null;
    }
    const first = points[0].value;
    const last = points[points.length - 1].value;
    if (!first) {
      return null;
    }
    return ((last - first) / first) * 100;
  }, [points]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[THEME.headerFrom, THEME.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View>
          <Text style={styles.headerKicker}>Live Currency</Text>
          <Text style={styles.headerTitle}>Chart</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.refreshButton} onPress={loadData}>
          <Icon name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.contentCard}>
        <Text style={styles.rateLabel}>1 {fromCode} equals</Text>
        <Text style={styles.rateValue}>
          {liveRate === null ? '--' : formatRate(liveRate)} {toCode}
        </Text>
        <Text style={styles.updatedText}>{liveUpdatedAt || 'Fetching latest rate...'}</Text>

        <View style={styles.pairRow}>
          <CurrencySelector
            selectedCode={fromCode}
            open={openMenu === 'from'}
            onToggle={() => setOpenMenu(current => (current === 'from' ? null : 'from'))}
            onSelect={code => {
              setFromCode(code);
              setOpenMenu(null);
            }}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.swapButton}
            onPress={() => {
              setOpenMenu(null);
              setFromCode(toCode);
              setToCode(fromCode);
            }}
          >
            <Icon name="swap-horizontal" size={25} color={THEME.primary} />
          </TouchableOpacity>
          <CurrencySelector
            selectedCode={toCode}
            open={openMenu === 'to'}
            onToggle={() => setOpenMenu(current => (current === 'to' ? null : 'to'))}
            onSelect={code => {
              setToCode(code);
              setOpenMenu(null);
            }}
            align="right"
          />
        </View>

        <View style={styles.rangeRow}>
          {RANGES.map(item => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              style={[styles.rangePill, range === item.key && styles.rangePillActive]}
              onPress={() => setRange(item.key)}
            >
              <Text style={[styles.rangeText, range === item.key && styles.rangeTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Rate movement</Text>
            <Text style={styles.chartSubtitle}>Historical data where available</Text>
          </View>
          {changePercent !== null && (
            <View style={styles.changePill}>
              <Icon
                name={changePercent >= 0 ? 'arrow-up-right' : 'arrow-down-right'}
                size={15}
                color={changePercent >= 0 ? THEME.primary : '#A84E4E'}
              />
              <Text style={[styles.changeText, changePercent < 0 && styles.changeTextDown]}>
                {changePercent.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={THEME.primary} />
            <Text style={styles.loadingText}>Loading live rates...</Text>
          </View>
        ) : points.length > 1 ? (
          <SimpleChart points={points} />
        ) : (
          <View style={styles.emptyChart}>
            <Icon name="chart-line-variant" size={34} color={THEME.subtext} />
            <Text style={styles.emptyTitle}>Chart unavailable</Text>
            <Text style={styles.emptyText}>{error || 'Try another supported currency pair.'}</Text>
          </View>
        )}
      </View>

      <BottomNav
        insetBottom={insets.bottom}
        onBackHome={onBackHome}
        onOpenConvert={onOpenConvert}
        onOpenCalculator={onOpenCalculator}
        onOpenSettings={onOpenSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.screenBg,
  },
  header: {
    minHeight: 150,
    paddingHorizontal: 22,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerKicker: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
  },
  headerTitle: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  contentCard: {
    flex: 1,
    marginTop: -18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 24,
    backgroundColor: '#FFFFFF',
  },
  rateLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: THEME.subtext,
  },
  rateValue: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '900',
    color: THEME.text,
  },
  updatedText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.subtext,
  },
  pairRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 20,
  },
  selectorWrap: {
    position: 'relative',
    zIndex: 20,
  },
  currencyPill: {
    minWidth: 132,
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F1EF',
  },
  flag: {
    fontSize: 26,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.text,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(THEME.primary, 0.09),
  },
  selectorMenu: {
    position: 'absolute',
    top: 62,
    left: 0,
    width: 286,
    maxHeight: 292,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 10,
    shadowColor: THEME.headerFrom,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  selectorMenuRight: {
    left: undefined,
    right: 0,
  },
  selectorScroll: {
    padding: 8,
    gap: 4,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
  },
  selectorItemActive: {
    backgroundColor: hexToRgba(THEME.primary, 0.08),
  },
  selectorFlag: {
    width: 34,
    fontSize: 25,
  },
  selectorCopy: {
    flex: 1,
  },
  selectorName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.text,
  },
  selectorCountry: {
    marginTop: 1,
    fontSize: 10.5,
    fontWeight: '600',
    color: THEME.subtext,
  },
  selectorCode: {
    fontSize: 12.5,
    fontWeight: '900',
    color: THEME.primary,
  },
  rangeRow: {
    marginTop: 18,
    padding: 4,
    borderRadius: 18,
    flexDirection: 'row',
    backgroundColor: '#F3F2EF',
  },
  rangePill: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangePillActive: {
    backgroundColor: '#FFFFFF',
  },
  rangeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.subtext,
  },
  rangeTextActive: {
    color: THEME.text,
  },
  chartHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.text,
  },
  chartSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.subtext,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: hexToRgba(THEME.primary, 0.09),
  },
  changeText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.primary,
  },
  changeTextDown: {
    color: '#A84E4E',
  },
  loadingBox: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.subtext,
  },
  chartBox: {
    height: CHART_HEIGHT,
    width: `${CHART_WIDTH_PERCENT}%`,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F4FAFC',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '24%',
    height: 1,
    backgroundColor: 'rgba(20,92,66,0.08)',
  },
  barRow: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '72%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartLabels: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartAxisLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.text,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#F4FAFC',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '900',
    color: THEME.text,
  },
  emptyText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: THEME.subtext,
  },
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navIconActive: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: hexToRgba(THEME.navActive, 0.12),
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.navInactive,
  },
  navLabelActive: {
    color: THEME.navActive,
  },
  fabSpacer: {
    flex: 1,
  },
  fabWrap: {
    position: 'absolute',
    top: -26,
    alignSelf: 'center',
    borderRadius: 30,
    padding: 4,
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: THEME.headerFrom,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChartScreen;
