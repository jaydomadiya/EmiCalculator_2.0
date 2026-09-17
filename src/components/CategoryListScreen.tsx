import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NativeAdCard from '../ads/NativeAdCard';
import { CategoryTileItem } from '../data/homeCategories';
import { ConverterTool } from '../types/converter';
import { THEME as COLORS, hexToRgba } from '../theme/colors';

const GROUP_SIZE = 2;

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

type Props = {
  title: string;
  headerIcon: string;
  items: CategoryTileItem[];
  t: (key: string) => string;
  onBack: () => void;
  onSelectLoanType?: (loanTypeKey: string) => void;
  onOpenConverterTool?: (tool: ConverterTool) => void;
};

function CategoryListScreen({
  title,
  headerIcon,
  items,
  t,
  onBack,
  onSelectLoanType,
  onOpenConverterTool,
}: Props) {
  const insets = useSafeAreaInsets();
  const groups = chunk(items, GROUP_SIZE);

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

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group, groupIndex) => (
          <View key={`group-${groupIndex}`}>
            <View style={styles.listCard}>
              {group.map((item, index) => {
                let onPress: (() => void) | undefined;
                if (item.loanTypeKey && onSelectLoanType) {
                  onPress = () => onSelectLoanType(item.loanTypeKey as string);
                } else if (item.action && onOpenConverterTool) {
                  const tool = item.action;
                  onPress = () => onOpenConverterTool(tool);
                }

                return (
                  <TouchableOpacity
                    key={item.labelKey}
                    style={[styles.row, index === group.length - 1 && styles.rowLast]}
                    activeOpacity={0.7}
                    onPress={onPress}
                  >
                    <View
                      style={[
                        styles.rowIconCircle,
                        {
                          backgroundColor: hexToRgba(item.color, 0.12),
                          borderColor: hexToRgba(item.color, 0.22),
                        },
                      ]}
                    >
                      <Icon name={item.icon as never} size={22} color={item.color} />
                    </View>
                    <Text style={styles.rowLabel}>{t(item.labelKey)}</Text>
                    <Icon name="chevron-right" size={20} color={COLORS.subtext} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.adSlot}>
              <NativeAdCard placement="tools" />
            </View>
          </View>
        ))}
      </ScrollView>
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
  },
  listCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.text,
  },
  adSlot: {
    marginTop: 18,
    marginBottom: 18,
  },
});

export default CategoryListScreen;
