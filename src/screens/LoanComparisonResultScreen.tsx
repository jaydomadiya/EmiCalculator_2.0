import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME, hexToRgba } from '../theme/colors';
import { LoanComparisonResult } from '../types/loanComparison';
import { formatCurrency } from '../utils/emi';

const COLORS = {
  headerFrom: THEME.headerFrom,
  headerTo: THEME.headerTo,
  screenBg: THEME.screenBg,
  cardBg: THEME.cardBg,
  text: THEME.text,
  subtext: THEME.subtext,
  border: THEME.border,
  primary: THEME.primary,
  gold: THEME.gold,
  goldDark: THEME.goldDark,
};

type Props = {
  result: LoanComparisonResult;
  onBack: () => void;
  onDone: () => void;
};

function metricWinner(a: number, b: number): 'a' | 'b' {
  return a <= b ? 'a' : 'b';
}

function CompareRow({
  label,
  valueA,
  valueB,
  winner,
  isLast,
}: {
  label: string;
  valueA: string;
  valueB: string;
  winner: 'a' | 'b';
  isLast?: boolean;
}) {
  return (
    <View style={[styles.compareRow, !isLast && styles.compareRowBorder]}>
      <Text style={styles.compareRowLabel}>{label}</Text>
      <View style={styles.compareValueCol}>
        <Text style={[styles.compareValue, winner === 'a' && styles.compareValueWinnerA]}>
          {valueA}
        </Text>
        {winner === 'a' && <Icon name="check-circle" size={13} color={COLORS.primary} />}
      </View>
      <View style={styles.compareValueCol}>
        <Text style={[styles.compareValue, winner === 'b' && styles.compareValueWinnerB]}>
          {valueB}
        </Text>
        {winner === 'b' && <Icon name="check-circle" size={13} color={COLORS.goldDark} />}
      </View>
    </View>
  );
}

function BarRow({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 0;

  return (
    <View style={styles.chartRow}>
      <Text style={styles.chartRowLabel}>{label}</Text>
      <View style={styles.chartTrack}>
        <View style={[styles.chartBar, { width: `${width}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.chartRowValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

function LoanComparisonResultScreen({ result, onBack, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const winnerLabel = result.winner === 'a' ? result.optionA.label : result.optionB.label;
  const winnerAccent = result.winner === 'a' ? COLORS.primary : COLORS.goldDark;
  const maxInterest = Math.max(result.resultA.totalInterest, result.resultB.totalInterest, 1);
  const maxPayment = Math.max(result.resultA.totalPayment, result.resultB.totalPayment, 1);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Icon name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparison Result</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.winnerCard}>
          <View style={[styles.winnerIconWrap, { backgroundColor: hexToRgba(winnerAccent, 0.13) }]}>
            <Icon name="trophy-outline" size={26} color={winnerAccent} />
          </View>
          <Text style={styles.winnerEyebrow}>Best option</Text>
          <Text style={styles.winnerTitle}>{winnerLabel}</Text>
          <Text style={styles.winnerSubtitle}>
            Saves {formatCurrency(result.savings)} ({result.savingsPercent.toFixed(1)}%) over the
            full tenure.
          </Text>
        </View>

        <View style={styles.snapshotRow}>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>Principal</Text>
            <Text style={styles.snapshotValue}>{formatCurrency(result.principal)}</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>Savings</Text>
            <Text style={styles.snapshotValue}>{formatCurrency(result.savings)}</Text>
          </View>
        </View>

        <View style={styles.compareCard}>
          <View style={styles.compareHeaderRow}>
            <View style={styles.compareRowLabelCol} />
            <View style={styles.compareValueCol}>
              <View style={[styles.compareDot, { backgroundColor: COLORS.primary }]} />
              <Text style={[styles.compareColHeader, { color: COLORS.primary }]}>Option A</Text>
            </View>
            <View style={styles.compareValueCol}>
              <View style={[styles.compareDot, { backgroundColor: COLORS.gold }]} />
              <Text style={[styles.compareColHeader, { color: COLORS.goldDark }]}>Option B</Text>
            </View>
          </View>

          <CompareRow
            label="Monthly EMI"
            valueA={formatCurrency(result.resultA.emi)}
            valueB={formatCurrency(result.resultB.emi)}
            winner={metricWinner(result.resultA.emi, result.resultB.emi)}
          />
          <CompareRow
            label="Total Interest"
            valueA={formatCurrency(result.resultA.totalInterest)}
            valueB={formatCurrency(result.resultB.totalInterest)}
            winner={metricWinner(result.resultA.totalInterest, result.resultB.totalInterest)}
          />
          <CompareRow
            label="Total Payment"
            valueA={formatCurrency(result.resultA.totalPayment)}
            valueB={formatCurrency(result.resultB.totalPayment)}
            winner={metricWinner(result.resultA.totalPayment, result.resultB.totalPayment)}
            isLast
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Total Interest Payable</Text>
          <BarRow
            label="A"
            value={result.resultA.totalInterest}
            maxValue={maxInterest}
            color={COLORS.primary}
          />
          <BarRow
            label="B"
            value={result.resultB.totalInterest}
            maxValue={maxInterest}
            color={COLORS.gold}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Total Repayment</Text>
          <BarRow
            label="A"
            value={result.resultA.totalPayment}
            maxValue={maxPayment}
            color={COLORS.primary}
          />
          <BarRow
            label="B"
            value={result.resultB.totalPayment}
            maxValue={maxPayment}
            color={COLORS.gold}
          />
        </View>

        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Offer details</Text>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Option A</Text>
            <Text style={styles.termValue}>
              {result.optionA.rate}% for {result.optionA.years} years
            </Text>
          </View>
          <View style={[styles.termRow, styles.termRowLast]}>
            <Text style={styles.termLabel}>Option B</Text>
            <Text style={styles.termValue}>
              {result.optionB.rate}% for {result.optionB.years} years
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={onDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
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
    paddingBottom: 16,
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
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  winnerCard: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.gold, 0.28),
    marginBottom: 14,
    elevation: 3,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  winnerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  winnerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.subtext,
    letterSpacing: 0.6,
  },
  winnerTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.headerFrom,
    marginTop: 4,
  },
  winnerSubtitle: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },
  snapshotLabel: {
    fontSize: 11.5,
    color: COLORS.subtext,
    fontWeight: '700',
  },
  snapshotValue: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 5,
  },
  compareCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  compareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compareRowLabelCol: {
    flex: 1.25,
  },
  compareDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  compareColHeader: {
    fontSize: 12,
    fontWeight: '800',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  compareRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compareRowLabel: {
    flex: 1.25,
    fontSize: 12.5,
    color: COLORS.subtext,
  },
  compareValueCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compareValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  compareValueWinnerA: {
    color: COLORS.primary,
  },
  compareValueWinnerB: {
    color: COLORS.goldDark,
  },
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  chartRowLabel: {
    width: 14,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.subtext,
  },
  chartTrack: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: COLORS.screenBg,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 6,
  },
  chartRowValue: {
    width: 92,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
  },
  termsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 18,
  },
  termsTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  termRowLast: {
    borderBottomWidth: 0,
  },
  termLabel: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  termValue: {
    fontSize: 13.5,
    color: COLORS.text,
    fontWeight: '800',
  },
  doneButton: {
    backgroundColor: COLORS.headerFrom,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default LoanComparisonResultScreen;
