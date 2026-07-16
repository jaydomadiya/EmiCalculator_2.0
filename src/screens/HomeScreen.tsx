import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const PALETTE = {
  emerald: '#1E8F5E',
  amber: '#D9822B',
  indigo: '#4C5FD5',
  rose: '#D5567C',
  teal: '#1897A6',
  violet: '#8B5CF6',
  gold: '#B8860B',
  sky: '#2F86EB',
  coral: '#E2673F',
  plum: '#9B4F8C',
};

const COLORS = {
  headerFrom: '#0B3D2E',
  headerTo: '#12594A',
  screenBg: '#FBFCFB',
  banner: '#EAF8F0',
  bannerButton: '#1E8F5E',
  sparkle: '#B8860B',
  text: '#132420',
  subtext: '#71807B',
  border: '#ECEFEE',
  navActive: '#1E8F5E',
  navInactive: '#9AA6A1',
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type TileItem = {
  labelKey: string;
  icon: string;
  color: string;
  loanTypeKey?: string;
};

type Section = {
  titleKey: string;
  items: TileItem[];
};

const SECTIONS: Section[] = [
  {
    titleKey: 'sections.converter',
    items: [
      { labelKey: 'tiles.currencyConverter', icon: 'cash-multiple', color: PALETTE.sky },
      { labelKey: 'tiles.cryptoConverter', icon: 'bitcoin', color: PALETTE.amber },
      { labelKey: 'tiles.customRate', icon: 'hand-coin-outline', color: PALETTE.teal },
      { labelKey: 'tiles.currencyList', icon: 'format-list-bulleted-square', color: PALETTE.indigo },
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
          { backgroundColor: hexToRgba(item.color, 0.14) },
        ]}
      >
        <Icon name={item.icon as never} size={25} color={item.color} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function GridSection({
  section,
  t,
  onSelectLoanType,
}: {
  section: Section;
  t: (key: string) => string;
  onSelectLoanType?: (loanTypeKey: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
      <View style={styles.tileGrid}>
        {section.items.map(item => (
          <Tile
            key={item.labelKey}
            item={item}
            label={t(item.labelKey)}
            onPress={
              item.loanTypeKey && onSelectLoanType
                ? () => onSelectLoanType(item.loanTypeKey as string)
                : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

function OtherCalculatorsCard({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('sections.other')}</Text>
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
}: {
  insetBottom: number;
  t: (key: string) => string;
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
      <TouchableOpacity activeOpacity={0.85} style={styles.fabWrap}>
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
};

function HomeScreen({ onOpenLoanCalculator }: HomeScreenProps) {
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
        <Text style={styles.headerTitle}>{t('common.appTitle')}</Text>
        <LinearGradient
          colors={['#E8C15C', '#B8860B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumBadge}
        >
          <Icon name="crown" size={17} color="#FFFFFF" />
        </LinearGradient>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerIcon}>
            <Icon name="creation" size={22} color={COLORS.sparkle} />
          </View>
          <Text style={styles.aiBannerText}>{t('banner.title')}</Text>
          <TouchableOpacity style={styles.aiChatButton} activeOpacity={0.85}>
            <Text style={styles.aiChatButtonText}>{t('banner.cta')}</Text>
          </TouchableOpacity>
        </View>

        {SECTIONS.map(section => (
          <GridSection
            key={section.titleKey}
            section={section}
            t={t}
            onSelectLoanType={onOpenLoanCalculator}
          />
        ))}

        <OtherCalculatorsCard t={t} />
      </ScrollView>

      <BottomNav insetBottom={insets.bottom} t={t} />

      <View style={styles.footerAdSlot} />
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
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  aiBanner: {
    backgroundColor: COLORS.banner,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    elevation: 1,
    shadowColor: '#0B3D2E',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  aiBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  aiChatButton: {
    backgroundColor: COLORS.bannerButton,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  aiChatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: 0.4,
    opacity: 0.75,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 11.5,
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
    backgroundColor: '#FFFFFF',
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navIconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 12,
  },
  navIconWrapActive: {
    backgroundColor: hexToRgba(COLORS.navActive, 0.12),
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.navInactive,
  },
  navLabelActive: {
    color: COLORS.navActive,
    fontWeight: '600',
  },
  fabSpacer: {
    flex: 1,
  },
  fabWrap: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  footerAdSlot: {
    height: 60,
    backgroundColor: COLORS.screenBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default HomeScreen;
