import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME, hexToRgba } from '../theme/colors';
import { LoanComparisonOptionInput, LoanComparisonResult } from '../types/loanComparison';
import { calculateEmi, formatCurrency, tenureToMonths } from '../utils/emi';

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

type OptionState = {
  years: string;
  rate: string;
};

const EMPTY_OPTION: OptionState = { years: '', rate: '' };

type Props = {
  onBack: () => void;
  onCalculate: (result: LoanComparisonResult) => void;
};

function formatAmountInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) {
    return '';
  }
  return Number(digits).toLocaleString('en-IN');
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function InputPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.inputPill}>
      <Icon name={icon as never} size={14} color={COLORS.primary} />
      <Text style={styles.inputPillText}>{label}</Text>
    </View>
  );
}

function OptionCard({
  title,
  accent,
  option,
  previewEmi,
  onChange,
}: {
  title: string;
  accent: string;
  option: OptionState;
  previewEmi: string;
  onChange: (patch: Partial<OptionState>) => void;
}) {
  return (
    <View style={styles.optionCard}>
      <View style={styles.optionHeaderRow}>
        <View
          style={[
            styles.optionBadge,
            { backgroundColor: hexToRgba(accent, 0.13), borderColor: hexToRgba(accent, 0.3) },
          ]}
        >
          <Text style={[styles.optionBadgeText, { color: accent }]}>{title.slice(-1)}</Text>
        </View>
        <View style={styles.optionTitleCol}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>Bank offer details</Text>
        </View>
        <View style={styles.previewChip}>
          <Text style={styles.previewLabel}>EMI</Text>
          <Text style={styles.previewValue} numberOfLines={1}>
            {previewEmi}
          </Text>
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={styles.rowFieldBox}>
          <FieldLabel>Tenure</FieldLabel>
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              value={option.years}
              onChangeText={text => onChange({ years: text.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.subtext}
            />
            <Text style={styles.fieldSuffix}>Yrs</Text>
          </View>
        </View>
        <View style={styles.rowFieldBox}>
          <FieldLabel>Interest</FieldLabel>
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              value={option.rate}
              onChangeText={text => onChange({ rate: text.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.subtext}
            />
            <Text style={styles.fieldSuffix}>%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function LoanComparisonScreen({ onBack, onCalculate }: Props) {
  const insets = useSafeAreaInsets();
  const [loanAmount, setLoanAmount] = useState('');
  const [optionA, setOptionA] = useState<OptionState>(EMPTY_OPTION);
  const [optionB, setOptionB] = useState<OptionState>(EMPTY_OPTION);

  const principal = Number(loanAmount);
  const isValid =
    principal > 0 &&
    Number(optionA.years) > 0 &&
    Number(optionA.rate) > 0 &&
    Number(optionB.years) > 0 &&
    Number(optionB.rate) > 0;

  const preview = useMemo(() => {
    const resultA =
      principal > 0 && Number(optionA.years) > 0 && Number(optionA.rate) > 0
        ? calculateEmi(principal, Number(optionA.rate), tenureToMonths(Number(optionA.years), 'Years'))
        : null;
    const resultB =
      principal > 0 && Number(optionB.years) > 0 && Number(optionB.rate) > 0
        ? calculateEmi(principal, Number(optionB.rate), tenureToMonths(Number(optionB.years), 'Years'))
        : null;

    return {
      emiA: resultA ? formatCurrency(resultA.emi) : '--',
      emiB: resultB ? formatCurrency(resultB.emi) : '--',
    };
  }, [optionA.rate, optionA.years, optionB.rate, optionB.years, principal]);

  const handleReset = () => {
    setLoanAmount('');
    setOptionA(EMPTY_OPTION);
    setOptionB(EMPTY_OPTION);
  };

  const handleCalculate = () => {
    if (!isValid) {
      return;
    }

    const resultA = calculateEmi(
      principal,
      Number(optionA.rate),
      tenureToMonths(Number(optionA.years), 'Years'),
    );
    const resultB = calculateEmi(
      principal,
      Number(optionB.rate),
      tenureToMonths(Number(optionB.years), 'Years'),
    );
    const winner = resultA.totalPayment <= resultB.totalPayment ? 'a' : 'b';
    const cheaper = winner === 'a' ? resultA : resultB;
    const costlier = winner === 'a' ? resultB : resultA;
    const savings = costlier.totalPayment - cheaper.totalPayment;

    onCalculate({
      principal,
      optionA: { label: 'Loan Option A', years: optionA.years, rate: optionA.rate },
      optionB: { label: 'Loan Option B', years: optionB.years, rate: optionB.rate },
      resultA,
      resultB,
      winner,
      savings,
      savingsPercent: costlier.totalPayment > 0 ? (savings / costlier.totalPayment) * 100 : 0,
    });
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
          name="scale-balance"
          size={132}
          color="rgba(255,255,255,0.06)"
          style={styles.headerWatermark}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Comparison</Text>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.8} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Compare two offers and see the cheaper total repayment.
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 104 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Icon name="bank-check" size={24} color={COLORS.goldDark} />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Same principal, clear winner</Text>
              <Text style={styles.heroSubtitle}>
                Enter bank rates and tenure. The next screen visualizes EMI, interest and total cost.
              </Text>
            </View>
          </View>

          <FieldLabel>Loan Amount</FieldLabel>
          <View style={styles.amountBox}>
            <Text style={styles.fieldPrefix}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={formatAmountInput(loanAmount)}
              onChangeText={text => setLoanAmount(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.subtext}
            />
          </View>

          <View style={styles.quickInfoRow}>
            <InputPill icon="calendar-clock" label="Tenure in years" />
            <InputPill icon="percent-outline" label="Annual interest" />
          </View>

          <OptionCard
            title="Loan Option A"
            accent={COLORS.primary}
            option={optionA}
            previewEmi={preview.emiA}
            onChange={patch => setOptionA(current => ({ ...current, ...patch }))}
          />
          <OptionCard
            title="Loan Option B"
            accent={COLORS.gold}
            option={optionB}
            previewEmi={preview.emiB}
            onChange={patch => setOptionB(current => ({ ...current, ...patch }))}
          />

          <TouchableOpacity
            style={[styles.calculateButton, !isValid && styles.calculateButtonDisabled]}
            activeOpacity={0.85}
            disabled={!isValid}
            onPress={handleCalculate}
          >
            <Icon name="chart-box-plus-outline" size={19} color="#FFFFFF" />
            <Text style={styles.calculateButtonText}>Calculate</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            For planning purposes only. Actual lender charges, taxes and fees may change the final
            repayment amount.
          </Text>
        </ScrollView>
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
    top: -18,
    right: -18,
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
  headerSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12.5,
    lineHeight: 17,
    marginLeft: 40,
    marginTop: 4,
    paddingRight: 24,
  },
  resetButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.gold, 0.28),
    backgroundColor: '#FFFDF8',
    marginBottom: 20,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: hexToRgba(COLORS.gold, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  heroSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    lineHeight: 16,
    marginTop: 3,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    marginBottom: 12,
  },
  fieldPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    padding: 0,
  },
  quickInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  inputPill: {
    flex: 1,
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: hexToRgba(COLORS.primary, 0.08),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  inputPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  optionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: {
    fontSize: 14,
    fontWeight: '900',
  },
  optionTitleCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  optionSubtitle: {
    fontSize: 11.5,
    color: COLORS.subtext,
    marginTop: 2,
  },
  previewChip: {
    maxWidth: 94,
    borderRadius: 13,
    backgroundColor: COLORS.screenBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  previewLabel: {
    fontSize: 9.5,
    color: COLORS.subtext,
    fontWeight: '700',
  },
  previewValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 1,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  rowFieldBox: {
    flex: 1,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
  },
  fieldSuffix: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.subtext,
  },
  calculateButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.headerFrom,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
    elevation: 3,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  calculateButtonDisabled: {
    opacity: 0.4,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 18,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 8,
  },
});

export default LoanComparisonScreen;
