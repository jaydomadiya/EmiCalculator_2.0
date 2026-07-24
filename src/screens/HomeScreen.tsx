import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NativeAdCard from '../ads/NativeAdCard';
import { useAds } from '../ads/AdsProvider';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CATEGORY_PALETTE as PALETTE, THEME as COLORS, hexToRgba } from '../theme/colors';

const DEFAULT_FAB_LOAN_TYPE = 'personalLoan';

export type ConverterTool =
  | 'currencyConverter'
  | 'cryptoConverter'
  | 'customRate'
  | 'currencyList'
  | 'chart'
  | 'settings'
  | 'loanComparison'
  | 'loanAnalysis'
  | 'homeAffordability'
  | 'savingsGoal'
  | 'fixedDeposit'
  | 'recurringDeposit'
  | 'sipCalculator'
  | 'returnOnInvestment'
  | 'creditCardPayoff'
  | 'creditCardMinPayment'
  | 'breakEvenSellPrice'
  | 'compoundInterest';

type TileItem = {
  labelKey: string;
  icon: string;
  color: string;
  loanTypeKey?: string;
  action?: ConverterTool;
};

type Section = {
  titleKey: string;
  items: TileItem[];
};

const SECTIONS: Section[] = [
  {
    titleKey: 'sections.converter',
    items: [
      { labelKey: 'tiles.currencyConverter', icon: 'cash-multiple', color: PALETTE.sky, action: 'currencyConverter' },
      { labelKey: 'tiles.cryptoConverter', icon: 'bitcoin', color: PALETTE.amber, action: 'cryptoConverter' },
      { labelKey: 'tiles.customRate', icon: 'hand-coin-outline', color: PALETTE.teal, action: 'customRate' },
      { labelKey: 'tiles.currencyList', icon: 'format-list-bulleted-square', color: PALETTE.indigo, action: 'currencyList' },
    ],
  },
  {
    titleKey: 'sections.emiCalculator',
    items: [
      { labelKey: 'tiles.personalLoan', icon: 'account-cash-outline', color: PALETTE.emerald, loanTypeKey: 'personalLoan' },
      { labelKey: 'tiles.mortgageLoan', icon: 'home-city-outline', color: PALETTE.indigo, loanTypeKey: 'mortgageLoan' },
      { labelKey: 'tiles.carLoan', icon: 'car-side', color: PALETTE.coral, loanTypeKey: 'carLoan' },
      { labelKey: 'tiles.businessLoan', icon: 'briefcase-variant-outline', color: PALETTE.plum, loanTypeKey: 'businessLoan' },
      { labelKey: 'tiles.goldLoan', icon: 'gold', color: PALETTE.gold, loanTypeKey: 'goldLoan' },
      { labelKey: 'tiles.studentLoan', icon: 'school-outline', color: PALETTE.sky, loanTypeKey: 'studentLoan' },
      { labelKey: 'tiles.cashLoan', icon: 'cash-fast', color: PALETTE.amber, loanTypeKey: 'cashLoan' },
      { labelKey: 'tiles.creditLoan', icon: 'credit-card-outline', color: PALETTE.rose, loanTypeKey: 'creditLoan' },
    ],
  },
  {
    titleKey: 'sections.financialPlanner',
    items: [
      {
        labelKey: 'tiles.loanComparison',
        icon: 'scale-balance',
        color: PALETTE.violet,
        action: 'loanComparison',
      },
      { labelKey: 'tiles.loanAnalysis', icon: 'chart-line-variant', color: PALETTE.teal, action: 'loanAnalysis' },
      { labelKey: 'tiles.homeAffordability', icon: 'home-search-outline', color: PALETTE.indigo, action: 'homeAffordability' },
      { labelKey: 'tiles.savingsGoal', icon: 'piggy-bank-outline', color: PALETTE.rose, action: 'savingsGoal' },
    ],
  },
  {
    titleKey: 'sections.investment',
    items: [
      { labelKey: 'tiles.fixedDeposit', icon: 'bank-outline', color: PALETTE.emerald, action: 'fixedDeposit' },
      { labelKey: 'tiles.recurringDeposit', icon: 'calendar-sync-outline', color: PALETTE.sky, action: 'recurringDeposit' },
      { labelKey: 'tiles.sipCalculator', icon: 'chart-donut', color: PALETTE.gold, action: 'sipCalculator' },
      { labelKey: 'tiles.returnOnInvestment', icon: 'trending-up', color: PALETTE.coral, action: 'returnOnInvestment' },
    ],
  },
];

const OTHER_CALCULATORS: TileItem[] = [
  { labelKey: 'tiles.creditCardPayoff', icon: 'credit-card-check-outline', color: PALETTE.emerald, action: 'creditCardPayoff' },
  { labelKey: 'tiles.creditCardMinPayment', icon: 'credit-card-clock-outline', color: PALETTE.rose, action: 'creditCardMinPayment' },
  { labelKey: 'tiles.breakEvenSellPrice', icon: 'tag-outline', color: PALETTE.amber, action: 'breakEvenSellPrice' },
  { labelKey: 'tiles.compoundInterest', icon: 'percent-outline', color: PALETTE.violet, action: 'compoundInterest' },
];

const NAV_ITEMS = [
  { key: 'home', labelKey: 'nav.home', icon: 'home-variant' },
  { key: 'convert', labelKey: 'nav.convert', icon: 'swap-horizontal-circle-outline' },
  { key: 'chart', labelKey: 'nav.chart', icon: 'chart-box-outline' },
  { key: 'settings', labelKey: 'nav.settings', icon: 'cog-outline' },
];

function Tile({
  item,
  label,
  onPress,
}: {
  item: TileItem;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.7} onPress={onPress}>
      <View
        style={[
          styles.tileIconCircle,
          {
            backgroundColor: hexToRgba(item.color, 0.12),
            borderColor: hexToRgba(item.color, 0.22),
          },
        ]}
      >
        <Icon name={item.icon as never} size={23} color={item.color} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeadingRow}>
      <View style={styles.sectionHeadingBar} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function GridSection({
  section,
  t,
  onSelectLoanType,
  onOpenConverterTool,
}: {
  section: Section;
  t: (key: string) => string;
  onSelectLoanType?: (loanTypeKey: string) => void;
  onOpenConverterTool?: (tool: ConverterTool) => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading label={t(section.titleKey)} />
      <View style={styles.sectionCard}>
        <View style={styles.tileGrid}>
          {section.items.map(item => {
            let onPress: (() => void) | undefined;
            if (item.loanTypeKey && onSelectLoanType) {
              onPress = () => onSelectLoanType(item.loanTypeKey as string);
            } else if (item.action && onOpenConverterTool) {
              const tool = item.action;
              onPress = () => onOpenConverterTool(tool);
            }

            return (
              <Tile key={item.labelKey} item={item} label={t(item.labelKey)} onPress={onPress} />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function OtherCalculatorsCard({
  t,
  onOpenConverterTool,
}: {
  t: (key: string) => string;
  onOpenConverterTool: (tool: ConverterTool) => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading label={t('sections.other')} />
      <View style={styles.otherCard}>
        {OTHER_CALCULATORS.map(item => (
          <TouchableOpacity
            key={item.labelKey}
            style={styles.otherItem}
            activeOpacity={0.7}
            onPress={item.action ? () => onOpenConverterTool(item.action as ConverterTool) : undefined}
          >
            <View
              style={[
                styles.otherIconCircle,
                { backgroundColor: hexToRgba(item.color, 0.14) },
              ]}
            >
              <Icon name={item.icon as never} size={18} color={item.color} />
            </View>
            <Text style={styles.otherItemLabel} numberOfLines={2}>
              {t(item.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function BottomNav({
  insetBottom,
  t,
  onPressFab,
  onPressConvert,
  onPressChart,
  onPressSettings,
}: {
  insetBottom: number;
  t: (key: string) => string;
  onPressFab: () => void;
  onPressConvert: () => void;
  onPressChart: () => void;
  onPressSettings: () => void;
}) {
  return (
    <View style={[styles.navBar, { paddingBottom: insetBottom }]}>
      <View style={styles.navRow}>
        {NAV_ITEMS.slice(0, 2).map(navItem => (
          <NavButton
            key={navItem.key}
            navItem={navItem}
            active={navItem.key === 'home'}
            label={t(navItem.labelKey)}
            onPress={navItem.key === 'convert' ? onPressConvert : undefined}
          />
        ))}
        <View style={styles.fabSpacer} />
        {NAV_ITEMS.slice(2).map(navItem => (
          <NavButton
            key={navItem.key}
            navItem={navItem}
            active={false}
            label={t(navItem.labelKey)}
            onPress={
              navItem.key === 'chart'
                ? onPressChart
                : navItem.key === 'settings'
                  ? onPressSettings
                  : undefined
            }
          />
        ))}
      </View>
      <TouchableOpacity activeOpacity={0.85} style={styles.fabWrap} onPress={onPressFab}>
        <LinearGradient
          colors={[COLORS.headerTo, COLORS.headerFrom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Icon name="plus" size={26} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function NavButton({
  navItem,
  active,
  label,
  onPress,
}: {
  navItem: { key: string; labelKey: string; icon: string };
  active: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navButton} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <Icon
          name={navItem.icon as never}
          size={20}
          color={active ? COLORS.navActive : COLORS.navInactive}
        />
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type HomeScreenProps = {
  onOpenLoanCalculator: (loanTypeKey: string) => void;
  onOpenConverterTool: (tool: ConverterTool) => void;
};

function HomeScreen({ onOpenLoanCalculator, onOpenConverterTool }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { maybeShowHomePopup } = useAds();

  useEffect(() => {
    maybeShowHomePopup();
  }, [maybeShowHomePopup]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Icon
          name="finance"
          size={74}
          color="rgba(255,255,255,0.06)"
          style={styles.headerWatermark}
        />
        <View style={styles.headerTopRow}>
          <View style={styles.brandMark}>
            <LinearGradient
              colors={['#F6E7B4', '#BFEBDD']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.brandMarkGradient}
            >
              <Icon name="bank-check" size={24} color={COLORS.headerFrom} />
            </LinearGradient>
          </View>
          <View style={styles.headerCopy}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {t('common.appTitle')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Keep the previous ad cadence, but render compact native ads in every
            slot that previously contained a banner. */}
        <NativeAdCard placement="home" format="compact" />

        {SECTIONS.map(section => (
          <View key={section.titleKey}>
            <GridSection
              section={section}
              t={t}
              onSelectLoanType={onOpenLoanCalculator}
              onOpenConverterTool={onOpenConverterTool}
            />
            <NativeAdCard placement="home" format="compact" />
          </View>
        ))}

        <OtherCalculatorsCard t={t} onOpenConverterTool={onOpenConverterTool} />

        <NativeAdCard placement="home" />

        <NativeAdCard placement="home" format="compact" />
      </ScrollView>

      <BottomNav
        insetBottom={insets.bottom}
        t={t}
        onPressFab={() => onOpenLoanCalculator(DEFAULT_FAB_LOAN_TYPE)}
        onPressConvert={() => onOpenConverterTool('currencyConverter')}
        onPressChart={() => onOpenConverterTool('chart')}
        onPressSettings={() => onOpenConverterTool('settings')}
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
    paddingHorizontal: 18,
    paddingBottom: 13,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerWatermark: {
    position: 'absolute',
    top: -8,
    right: -10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  brandMarkGradient: {
    flex: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionHeadingBar: {
    width: 3,
    height: 13,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.6,
    opacity: 0.8,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    paddingBottom: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tileIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  otherCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.cardBg,
    elevation: 1,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  otherItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  otherIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherItemLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 15,
  },
  navBar: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
    shadowColor: COLORS.headerFrom,
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
    gap: 3,
  },
  navIconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  navIconWrapActive: {
    backgroundColor: hexToRgba(COLORS.navActive, 0.12),
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: COLORS.navInactive,
  },
  navLabelActive: {
    color: COLORS.navActive,
    fontWeight: '700',
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
    shadowColor: COLORS.headerFrom,
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

export default HomeScreen;
