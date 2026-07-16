import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CATEGORY_PALETTE as PALETTE, THEME as COLORS, hexToRgba } from '../theme/colors';

const DEFAULT_FAB_LOAN_TYPE = 'personalLoan';

export type ConverterTool = 'currencyConverter' | 'cryptoConverter' | 'customRate' | 'currencyList';

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
      { labelKey: 'tiles.loanComparison', icon: 'scale-balance', color: PALETTE.violet },
      { labelKey: 'tiles.loanAnalysis', icon: 'chart-line-variant', color: PALETTE.teal },
      { labelKey: 'tiles.homeAffordability', icon: 'home-search-outline', color: PALETTE.indigo },
      { labelKey: 'tiles.savingsGoal', icon: 'piggy-bank-outline', color: PALETTE.rose },
    ],
  },
  {
    titleKey: 'sections.investment',
    items: [
      { labelKey: 'tiles.fixedDeposit', icon: 'bank-outline', color: PALETTE.emerald },
      { labelKey: 'tiles.recurringDeposit', icon: 'calendar-sync-outline', color: PALETTE.sky },
      { labelKey: 'tiles.sipCalculator', icon: 'chart-donut', color: PALETTE.gold },
      { labelKey: 'tiles.returnOnInvestment', icon: 'trending-up', color: PALETTE.coral },
    ],
  },
];

const OTHER_CALCULATORS: TileItem[] = [
  { labelKey: 'tiles.creditCardPayoff', icon: 'credit-card-check-outline', color: PALETTE.emerald },
  { labelKey: 'tiles.creditCardMinPayment', icon: 'credit-card-clock-outline', color: PALETTE.rose },
  { labelKey: 'tiles.breakEvenSellPrice', icon: 'tag-outline', color: PALETTE.amber },
  { labelKey: 'tiles.compoundInterest', icon: 'percent-outline', color: PALETTE.violet },
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

function OtherCalculatorsCard({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.section}>
      <SectionHeading label={t('sections.other')} />
      <View style={styles.otherCard}>
        {OTHER_CALCULATORS.map(item => (
          <TouchableOpacity
            key={item.labelKey}
            style={styles.otherItem}
            activeOpacity={0.7}
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
}: {
  insetBottom: number;
  t: (key: string) => string;
  onPressFab: () => void;
}) {
  return (
    <View style={[styles.navBar, { paddingBottom: insetBottom }]}>
      <View style={styles.navRow}>
        {NAV_ITEMS.slice(0, 2).map(navItem => (
          <NavButton key={navItem.key} navItem={navItem} active={navItem.key === 'home'} label={t(navItem.labelKey)} />
        ))}
        <View style={styles.fabSpacer} />
        {NAV_ITEMS.slice(2).map(navItem => (
          <NavButton key={navItem.key} navItem={navItem} active={false} label={t(navItem.labelKey)} />
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
}: {
  navItem: { key: string; labelKey: string; icon: string };
  active: boolean;
  label: string;
}) {
  return (
    <TouchableOpacity style={styles.navButton} activeOpacity={0.7}>
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
          size={128}
          color="rgba(255,255,255,0.06)"
          style={styles.headerWatermark}
        />
        <Text style={styles.headerTitle}>{t('common.appTitle')}</Text>
        <View style={styles.headerAccent} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map(section => (
          <GridSection
            key={section.titleKey}
            section={section}
            t={t}
            onSelectLoanType={onOpenLoanCalculator}
            onOpenConverterTool={onOpenConverterTool}
          />
        ))}

        <OtherCalculatorsCard t={t} />
      </ScrollView>

      <BottomNav
        insetBottom={insets.bottom}
        t={t}
        onPressFab={() => onOpenLoanCalculator(DEFAULT_FAB_LOAN_TYPE)}
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerWatermark: {
    position: 'absolute',
    top: -24,
    right: -18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerAccent: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
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
    borderRadius: 20,
    padding: 16,
    paddingBottom: 4,
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
    width: 54,
    height: 54,
    borderRadius: 27,
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
    borderRadius: 20,
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
