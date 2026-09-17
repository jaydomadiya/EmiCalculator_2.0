import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NativeAdCard from '../ads/NativeAdCard';
import { useAds } from '../ads/AdsProvider';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CATEGORY_PALETTE as PALETTE, THEME as COLORS, hexToRgba } from '../theme/colors';
import { ConverterTool } from '../types/converter';

export type { ConverterTool };

const DEFAULT_FAB_LOAN_TYPE = 'personalLoan';

type HomeEntry = {
  titleKey: string;
  labelKey: string;
  icon: string;
  color: string;
  action: ConverterTool;
};

const HOME_ENTRIES: HomeEntry[] = [
  {
    titleKey: 'sections.converter',
    labelKey: 'tiles.converter',
    icon: 'swap-horizontal-bold',
    color: PALETTE.sky,
    action: 'converterList',
  },
  {
    titleKey: 'sections.emiCalculator',
    labelKey: 'tiles.emiCalculator',
    icon: 'calculator-variant',
    color: PALETTE.emerald,
    action: 'emiCalculatorList',
  },
  {
    titleKey: 'sections.financialPlanner',
    labelKey: 'sections.financialPlanner',
    icon: 'chart-areaspline',
    color: PALETTE.violet,
    action: 'financialPlannerList',
  },
  {
    titleKey: 'sections.investment',
    labelKey: 'sections.investment',
    icon: 'chart-donut',
    color: PALETTE.gold,
    action: 'investmentList',
  },
  {
    titleKey: 'sections.other',
    labelKey: 'tiles.otherCalculators',
    icon: 'calculator-variant-outline',
    color: PALETTE.amber,
    action: 'otherCalculatorList',
  },
];

const NAV_ITEMS = [
  { key: 'home', labelKey: 'nav.home', icon: 'home-variant' },
  { key: 'convert', labelKey: 'nav.convert', icon: 'swap-horizontal-circle-outline' },
  { key: 'chart', labelKey: 'nav.chart', icon: 'chart-box-outline' },
  { key: 'settings', labelKey: 'nav.settings', icon: 'cog-outline' },
];

function SectionHeading({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeadingRow}>
      <View style={styles.sectionHeadingBar} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function CategoryEntryCard({
  entry,
  t,
  onPress,
}: {
  entry: HomeEntry;
  t: (key: string) => string;
  onPress: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading label={t(entry.titleKey)} />
      <TouchableOpacity style={styles.entryCard} activeOpacity={0.75} onPress={onPress}>
        <View
          style={[
            styles.entryCardIcon,
            {
              backgroundColor: hexToRgba(entry.color, 0.12),
              borderColor: hexToRgba(entry.color, 0.22),
            },
          ]}
        >
          <Icon name={entry.icon as never} size={24} color={entry.color} />
        </View>
        <Text style={styles.entryCardTitle}>{t(entry.labelKey)}</Text>
        <Icon name="chevron-right" size={22} color={COLORS.subtext} />
      </TouchableOpacity>
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

        {HOME_ENTRIES.map(entry => (
          <View key={entry.titleKey}>
            <CategoryEntryCard entry={entry} t={t} onPress={() => onOpenConverterTool(entry.action)} />
            <NativeAdCard placement="home" format="compact" />
          </View>
        ))}

        <NativeAdCard placement="home" />
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
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 1,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  entryCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
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
