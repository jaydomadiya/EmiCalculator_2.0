import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';
import { THEME, hexToRgba } from '../theme/colors';

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
  danger: '#B95555',
};

type ScreenState = 'form' | 'result' | 'amortization';
type AnalysisMode = 'base' | 'advanced';
type BaseCalcType = 'payment' | 'amount' | 'term' | 'rate';

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type FrequencyValue = 'monthly' | 'semiMonthly' | 'biWeekly' | 'weekly';
type CompoundValue = 'monthly' | 'quarterly' | 'semiAnnual' | 'annual';

type ScheduleRow = {
  period: number;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  paidPercent: number;
};

type AnalysisResult = {
  title: string;
  mode: AnalysisMode;
  principal: number;
  periodicPayment: number;
  annualRate: number;
  periods: number;
  paymentsPerYear: number;
  totalPayment: number;
  totalInterest: number;
  annualPayment: number;
  termLabel: string;
  schedule: ScheduleRow[];
};

type Props = {
  onBack: () => void;
};

const BASE_CALC_TYPES: SelectOption<BaseCalcType>[] = [
  { label: 'Calculate Monthly Payment', value: 'payment' },
  { label: 'Calculate Loan Amount', value: 'amount' },
  { label: 'Calculate Loan Term', value: 'term' },
  { label: 'Calculate Annual Interest Rate', value: 'rate' },
];

const FREQUENCIES: Array<SelectOption<FrequencyValue> & { periodsPerYear: number }> = [
  { label: 'Monthly (12/Yr)', value: 'monthly', periodsPerYear: 12 },
  { label: 'Semi-monthly (24/Yr)', value: 'semiMonthly', periodsPerYear: 24 },
  { label: 'Bi-weekly (26/Yr)', value: 'biWeekly', periodsPerYear: 26 },
  { label: 'Weekly (52/Yr)', value: 'weekly', periodsPerYear: 52 },
];

const COMPOUNDING: Array<SelectOption<CompoundValue> & { periodsPerYear: number }> = [
  { label: 'Monthly (12/Yr)', value: 'monthly', periodsPerYear: 12 },
  { label: 'Quarterly (4/Yr)', value: 'quarterly', periodsPerYear: 4 },
  { label: 'Semi-annual (2/Yr)', value: 'semiAnnual', periodsPerYear: 2 },
  { label: 'Annual (1/Yr)', value: 'annual', periodsPerYear: 1 },
];

function digitsOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

function decimalOnly(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
}

function formatAmountInput(raw: string): string {
  const digits = digitsOnly(raw);
  return digits ? Number(digits).toLocaleString('en-IN') : '';
}

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) {
    return '₹0';
  }
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value)) {
    return '₹0';
  }
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return formatMoney(value);
}

function getFrequency(value: FrequencyValue) {
  return FREQUENCIES.find(item => item.value === value) ?? FREQUENCIES[0];
}

function getCompounding(value: CompoundValue) {
  return COMPOUNDING.find(item => item.value === value) ?? COMPOUNDING[0];
}

function termToPeriods(years: number, months: number, periodsPerYear: number): number {
  return Math.max(1, Math.round((years + months / 12) * periodsPerYear));
}

function rawTermPeriods(years: number, months: number, periodsPerYear: number): number {
  return Math.round((years + months / 12) * periodsPerYear);
}

function periodsToTermLabel(periods: number, periodsPerYear: number): string {
  const months = Math.round((periods / periodsPerYear) * 12);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years <= 0) {
    return `${remainingMonths} Months`;
  }
  if (remainingMonths <= 0) {
    return `${years} Years`;
  }
  return `${years} Years ${remainingMonths} Months`;
}

function periodicRate(annualRate: number, paymentsPerYear: number, compoundsPerYear: number): number {
  if (annualRate <= 0) {
    return 0;
  }
  return Math.pow(1 + annualRate / 100 / compoundsPerYear, compoundsPerYear / paymentsPerYear) - 1;
}

function paymentFor(principal: number, ratePerPeriod: number, periods: number): number {
  if (principal <= 0 || periods <= 0) {
    return 0;
  }
  if (ratePerPeriod <= 0) {
    return principal / periods;
  }
  return (principal * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -periods));
}

function principalFor(payment: number, ratePerPeriod: number, periods: number): number {
  if (payment <= 0 || periods <= 0) {
    return 0;
  }
  if (ratePerPeriod <= 0) {
    return payment * periods;
  }
  return payment * ((1 - Math.pow(1 + ratePerPeriod, -periods)) / ratePerPeriod);
}

function periodsFor(principal: number, payment: number, ratePerPeriod: number): number {
  if (principal <= 0 || payment <= 0) {
    return 0;
  }
  if (ratePerPeriod <= 0) {
    return Math.ceil(principal / payment);
  }
  if (payment <= principal * ratePerPeriod) {
    return 0;
  }
  return Math.ceil(-Math.log(1 - (principal * ratePerPeriod) / payment) / Math.log(1 + ratePerPeriod));
}

function solveAnnualRate(principal: number, payment: number, periods: number, paymentsPerYear: number): number {
  if (principal <= 0 || payment <= 0 || periods <= 0) {
    return 0;
  }

  let low = 0;
  let high = 1;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const guessedPayment = paymentFor(principal, mid, periods);
    if (guessedPayment > payment) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return ((low + high) / 2) * paymentsPerYear * 100;
}

function buildSchedule(
  principal: number,
  payment: number,
  ratePerPeriod: number,
  maxPeriods: number,
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let balance = principal;
  let period = 1;

  while (balance > 0.01 && period <= Math.min(maxPeriods, 1200)) {
    const openingBalance = balance;
    const interest = balance * ratePerPeriod;
    const principalPaid = Math.min(Math.max(payment - interest, 0), balance);
    const actualPayment = principalPaid + interest;
    balance = Math.max(balance - principalPaid, 0);
    rows.push({
      period,
      openingBalance,
      payment: actualPayment,
      interest,
      principal: principalPaid,
      balance,
      paidPercent: principal > 0 ? ((principal - balance) / principal) * 100 : 100,
    });
    period += 1;

    if (principalPaid <= 0) {
      break;
    }
  }

  return rows;
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function FieldBox({
  value,
  onChangeText,
  placeholder = '0',
  suffix,
  isAmount,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix?: string;
  isAmount?: boolean;
}) {
  return (
    <View style={styles.fieldBox}>
      {isAmount && <Text style={styles.fieldPrefix}>₹</Text>}
      <TextInput
        style={styles.fieldInput}
        value={isAmount ? formatAmountInput(value) : value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={COLORS.subtext}
      />
      {suffix && <Text style={styles.fieldSuffix}>{suffix}</Text>}
    </View>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  const [visible, setVisible] = useState(false);
  const selected = options.find(option => option.value === value) ?? options[0];

  return (
    <>
      <FieldLabel>{label}</FieldLabel>
      <TouchableOpacity style={styles.selectBox} activeOpacity={0.75} onPress={() => setVisible(true)}>
        <Text style={styles.selectValue}>{selected.label}</Text>
        <Icon name="chevron-down" size={22} color={COLORS.subtext} />
      </TouchableOpacity>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalRow}
                activeOpacity={0.75}
                onPress={() => {
                  onChange(option.value);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalRowText}>{option.label}</Text>
                {option.value === value && <Icon name="check" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function SummaryRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.summaryRow, !isLast && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function AmortizationMetric({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.amortMetricCard}>
      <View style={[styles.amortMetricIcon, { backgroundColor: hexToRgba(accent, 0.13) }]}>
        <Icon name={icon as never} size={18} color={accent} />
      </View>
      <Text style={styles.amortMetricLabel}>{label}</Text>
      <Text style={styles.amortMetricValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function AmortizationRow({ item }: { item: ScheduleRow }) {
  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleTopRow}>
        <View style={styles.periodBadge}>
          <Text style={styles.periodBadgeText}>{item.period}</Text>
        </View>
        <View style={styles.scheduleTitleCol}>
          <Text style={styles.scheduleTitle}>Payment #{item.period}</Text>
          <Text style={styles.scheduleSubtitle}>
            Balance {formatCompactMoney(item.openingBalance)} to {formatCompactMoney(item.balance)}
          </Text>
        </View>
        <Text style={styles.schedulePayment}>{formatMoney(item.payment)}</Text>
      </View>

      <View style={styles.scheduleProgressTrack}>
        <View style={[styles.scheduleProgressFill, { width: `${Math.min(item.paidPercent, 100)}%` }]} />
      </View>

      <View style={styles.scheduleGrid}>
        <View style={styles.scheduleMetric}>
          <Text style={styles.scheduleMetricLabel}>Interest</Text>
          <Text style={[styles.scheduleMetricValue, styles.interestText]}>{formatMoney(item.interest)}</Text>
        </View>
        <View style={styles.scheduleMetric}>
          <Text style={styles.scheduleMetricLabel}>Principal</Text>
          <Text style={[styles.scheduleMetricValue, styles.principalText]}>{formatMoney(item.principal)}</Text>
        </View>
        <View style={styles.scheduleMetric}>
          <Text style={styles.scheduleMetricLabel}>Balance</Text>
          <Text style={styles.scheduleMetricValue}>{formatMoney(item.balance)}</Text>
        </View>
      </View>
    </View>
  );
}

function LoanAnalysisScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<ScreenState>('form');
  const [mode, setMode] = useState<AnalysisMode>('base');
  const [calcType, setCalcType] = useState<BaseCalcType>('payment');
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const [numberPayments, setNumberPayments] = useState('');
  const [frequency, setFrequency] = useState<FrequencyValue>('monthly');
  const [compounding, setCompounding] = useState<CompoundValue>('monthly');
  const [additionalPayment, setAdditionalPayment] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setMode('base');
    setCalcType('payment');
    setAmount('');
    setPayment('');
    setRate('');
    setYears('');
    setMonths('');
    setNumberPayments('');
    setFrequency('monthly');
    setCompounding('monthly');
    setAdditionalPayment('');
    setResult(null);
    setErrorMessage('');
    setScreen('form');
  };

  const canCalculate = useMemo(() => {
    const principal = Number(amount);
    const periodicPayment = Number(payment);
    const annualRate = Number(rate);
    const totalPeriods = rawTermPeriods(Number(years), Number(months), 12);

    if (mode === 'advanced') {
      return principal > 0 && annualRate >= 0 && Number(numberPayments) > 0;
    }
    if (calcType === 'payment') {
      return principal > 0 && annualRate >= 0 && totalPeriods > 0;
    }
    if (calcType === 'amount') {
      return periodicPayment > 0 && annualRate >= 0 && totalPeriods > 0;
    }
    if (calcType === 'term') {
      return principal > 0 && periodicPayment > 0 && annualRate >= 0;
    }
    return principal > 0 && periodicPayment > 0 && totalPeriods > 0;
  }, [amount, calcType, mode, months, numberPayments, payment, rate, years]);

  const handleCalculate = () => {
    if (!canCalculate) {
      return;
    }
    setErrorMessage('');

    const selectedFrequency = getFrequency(frequency);
    const selectedCompounding = getCompounding(compounding);
    const paymentsPerYear = mode === 'advanced' ? selectedFrequency.periodsPerYear : 12;
    const compoundsPerYear = mode === 'advanced' ? selectedCompounding.periodsPerYear : 12;
    let principal = Number(amount);
    let annualRate = Number(rate);
    let periods = mode === 'advanced'
      ? Math.round(Number(numberPayments))
      : termToPeriods(Number(years), Number(months), paymentsPerYear);
    const periodic = periodicRate(annualRate, paymentsPerYear, compoundsPerYear);
    let periodicPayment = Number(payment);

    if (mode === 'base') {
      if (calcType === 'payment') {
        periodicPayment = paymentFor(principal, periodic, periods);
      } else if (calcType === 'amount') {
        principal = principalFor(periodicPayment, periodic, periods);
      } else if (calcType === 'term') {
        periods = periodsFor(principal, periodicPayment, periodic);
        if (periods <= 0) {
          setErrorMessage('Payment is too low to close this loan. Increase the payment or reduce the interest rate.');
          return;
        }
      } else if (calcType === 'rate') {
        if (periodicPayment * periods < principal) {
          setErrorMessage('Payment and tenure do not cover the principal. Increase payment or tenure.');
          return;
        }
        annualRate = solveAnnualRate(principal, periodicPayment, periods, paymentsPerYear);
      }
    } else {
      periodicPayment = paymentFor(principal, periodic, periods) + Number(additionalPayment || 0);
    }

    const solvedPeriodic = periodicRate(annualRate, paymentsPerYear, compoundsPerYear);
    const schedule = buildSchedule(principal, periodicPayment, solvedPeriodic, Math.max(periods, 1));
    const isPaidOff = schedule.length > 0 && schedule[schedule.length - 1].balance <= 0.01;
    if (!isPaidOff) {
      setErrorMessage('This payment does not amortize the loan. Increase payment or reduce the rate.');
      return;
    }
    const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0);
    const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);

    setResult({
      title: mode === 'base'
        ? BASE_CALC_TYPES.find(item => item.value === calcType)?.label ?? 'Loan Analysis'
        : 'Advanced Payment Analysis',
      mode,
      principal,
      periodicPayment,
      annualRate,
      periods: schedule.length || periods,
      paymentsPerYear,
      totalPayment,
      totalInterest,
      annualPayment: periodicPayment * paymentsPerYear,
      termLabel: periodsToTermLabel(schedule.length || periods, paymentsPerYear),
      schedule,
    });
    setScreen('result');
  };

  const handleBack = () => {
    if (screen === 'amortization') {
      setScreen('result');
      return;
    }
    if (screen === 'result') {
      setScreen('form');
      return;
    }
    onBack();
  };

  const principalShare = result && result.totalPayment > 0
    ? (result.principal / result.totalPayment) * 100
    : 0;
  const interestShare = result ? Math.max(100 - principalShare, 0) : 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Icon
          name="chart-line-variant"
          size={140}
          color="rgba(255,255,255,0.07)"
          style={styles.headerWatermark}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {screen === 'amortization' ? 'Amortization Details' : screen === 'result' ? 'Loan Analysis Result' : 'Loan Analysis'}
          </Text>
          {screen === 'form' ? (
            <TouchableOpacity onPress={resetForm} activeOpacity={0.8} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
        </View>
      </LinearGradient>

      {screen === 'form' && (
        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <KeyboardAwareScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 104 }]}
            showsVerticalScrollIndicator={false}
            extraKeyboardSpace={34}
          >
            <View style={styles.segmentRow}>
              {(['base', 'advanced'] as AnalysisMode[]).map(item => (
                <TouchableOpacity
                  key={item}
                  style={[styles.segmentButton, mode === item && styles.segmentButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setMode(item)}
                >
                  <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>
                    {item === 'base' ? 'Base' : 'Advanced'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Icon name="calculator-variant-outline" size={23} color={COLORS.goldDark} />
              </View>
              <View style={styles.heroTextCol}>
                <Text style={styles.heroTitle}>Plan the full loan journey</Text>
                <Text style={styles.heroSubtitle}>
                  Solve payment, principal, term, rate, and inspect every repayment row.
                </Text>
              </View>
            </View>

            {mode === 'base' ? (
              <>
                <SelectField label="Loan Type" value={calcType} options={BASE_CALC_TYPES} onChange={setCalcType} />
                {calcType !== 'amount' && (
                  <>
                    <FieldLabel>Loan Amount</FieldLabel>
                    <FieldBox value={amount} onChangeText={text => setAmount(digitsOnly(text))} isAmount />
                  </>
                )}
                {calcType !== 'rate' && (
                  <>
                    <FieldLabel>Annual Interest Rate</FieldLabel>
                    <FieldBox value={rate} onChangeText={text => setRate(decimalOnly(text))} suffix="%/year" />
                  </>
                )}
                {calcType !== 'payment' && (
                  <>
                    <FieldLabel>Monthly Payment</FieldLabel>
                    <FieldBox value={payment} onChangeText={text => setPayment(digitsOnly(text))} isAmount />
                  </>
                )}
                {calcType !== 'term' && (
                  <>
                    <FieldLabel>Loan Tenure</FieldLabel>
                    <View style={styles.twoColumnRow}>
                      <View style={styles.twoColumnItem}>
                        <Text style={styles.smallLabel}>Year</Text>
                        <FieldBox value={years} onChangeText={text => setYears(digitsOnly(text))} />
                      </View>
                      <View style={styles.twoColumnItem}>
                        <Text style={styles.smallLabel}>Month</Text>
                        <FieldBox value={months} onChangeText={text => setMonths(digitsOnly(text))} />
                      </View>
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                <SelectField
                  label="Loan Type"
                  value="payment"
                  options={[{ label: 'Calculate Each Payment', value: 'payment' }]}
                  onChange={() => undefined}
                />
                <FieldLabel>Loan Amount</FieldLabel>
                <FieldBox value={amount} onChangeText={text => setAmount(digitsOnly(text))} isAmount />
                <FieldLabel>Annual Interest Rate</FieldLabel>
                <FieldBox value={rate} onChangeText={text => setRate(decimalOnly(text))} suffix="%/year" />
                <FieldLabel>Number of Payments</FieldLabel>
                <FieldBox value={numberPayments} onChangeText={text => setNumberPayments(digitsOnly(text))} />
                <SelectField label="Payment Frequency" value={frequency} options={FREQUENCIES} onChange={setFrequency} />
                <SelectField label="Compounding" value={compounding} options={COMPOUNDING} onChange={setCompounding} />
                <FieldLabel>Additional to Each Payment</FieldLabel>
                <FieldBox
                  value={additionalPayment}
                  onChangeText={text => setAdditionalPayment(digitsOnly(text))}
                  isAmount
                />
              </>
            )}

            {errorMessage ? (
              <View style={styles.errorCard}>
                <Icon name="alert-circle-outline" size={18} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.nextButton, !canCalculate && styles.nextButtonDisabled]}
              activeOpacity={0.85}
              disabled={!canCalculate}
              onPress={handleCalculate}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      )}

      {screen === 'result' && result && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultHero}>
            <Text style={styles.resultEyebrow}>{result.title}</Text>
            <Text style={styles.resultValue}>{formatMoney(result.periodicPayment)}</Text>
            <Text style={styles.resultSubtitle}>
              {result.mode === 'advanced' ? getFrequency(frequency).label : 'Monthly payment'}
            </Text>
            <View style={styles.breakdownBar}>
              <View style={[styles.breakdownSegment, { flex: principalShare, backgroundColor: COLORS.primary }]} />
              <View style={[styles.breakdownSegment, { flex: interestShare, backgroundColor: COLORS.gold }]} />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Principal {formatMoney(result.principal)}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.gold }]} />
                <Text style={styles.legendText}>Interest {formatMoney(result.totalInterest)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <SummaryRow label="Loan Amount" value={formatMoney(result.principal)} />
            <SummaryRow label="Annual Interest Rate" value={`${result.annualRate.toFixed(2)}%`} />
            <SummaryRow label="Loan Term" value={result.termLabel} />
            <SummaryRow label="Total Payments" value={`${result.periods}`} />
            <SummaryRow label="Total Payment" value={formatMoney(result.totalPayment)} />
            <SummaryRow label="Annual Payment" value={formatMoney(result.annualPayment)} isLast />
          </View>

          <View style={styles.insightRow}>
            <View style={styles.insightCard}>
              <Icon name="percent-outline" size={19} color={COLORS.goldDark} />
              <Text style={styles.insightLabel}>Interest share</Text>
              <Text style={styles.insightValue}>
                {result.totalPayment > 0 ? ((result.totalInterest / result.totalPayment) * 100).toFixed(1) : '0'}%
              </Text>
            </View>
            <View style={styles.insightCard}>
              <Icon name="calendar-clock" size={19} color={COLORS.primary} />
              <Text style={styles.insightLabel}>Payoff rows</Text>
              <Text style={styles.insightValue}>{result.schedule.length}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => setScreen('amortization')}>
            <Icon name="table-large" size={19} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Amortization</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={onBack}>
            <Text style={styles.secondaryButtonText}>Back To Home</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {screen === 'amortization' && result && (
        <FlatList
          style={styles.tableList}
          contentContainerStyle={[styles.tableContent, { paddingBottom: insets.bottom + 36 }]}
          data={result.schedule}
          keyExtractor={item => String(item.period)}
          ListHeaderComponent={
            <>
              <View style={styles.amortHero}>
                <View style={styles.amortHeroTop}>
                  <View>
                    <Text style={styles.amortHeroEyebrow}>Repayment schedule</Text>
                    <Text style={styles.amortHeroTitle}>{result.termLabel}</Text>
                  </View>
                  <View style={styles.amortHeroIcon}>
                    <Icon name="chart-timeline-variant" size={24} color={COLORS.goldDark} />
                  </View>
                </View>
                <View style={styles.amortProgressTrack}>
                  <View
                    style={[
                      styles.amortProgressPrincipal,
                      {
                        flex: result.totalPayment > 0 ? result.principal / result.totalPayment : 1,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.amortProgressInterest,
                      {
                        flex: result.totalPayment > 0 ? result.totalInterest / result.totalPayment : 0,
                      },
                    ]}
                  />
                </View>
                <View style={styles.amortLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={styles.legendText}>Principal {formatCompactMoney(result.principal)}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.gold }]} />
                    <Text style={styles.legendText}>Interest {formatCompactMoney(result.totalInterest)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.amortMetricRow}>
                <AmortizationMetric
                  icon="cash-check"
                  label="Payment"
                  value={formatCompactMoney(result.periodicPayment)}
                  accent={COLORS.primary}
                />
                <AmortizationMetric
                  icon="calendar-month-outline"
                  label="Rows"
                  value={`${result.schedule.length}`}
                  accent={COLORS.goldDark}
                />
                <AmortizationMetric
                  icon="bank-transfer-out"
                  label="Total"
                  value={formatCompactMoney(result.totalPayment)}
                  accent="#3E7CA6"
                />
              </View>

              <Text style={styles.scheduleSectionTitle}>Payment ledger</Text>
            </>
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <AmortizationRow item={item} />}
        />
      )}
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
    top: -22,
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
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  resetButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.64)',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  keyboardAvoider: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  segmentButtonActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#FFFDF8',
  },
  segmentText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: COLORS.headerFrom,
  },
  heroCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.primary, 0.12),
    padding: 16,
    marginBottom: 18,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: hexToRgba(COLORS.gold, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    lineHeight: 16,
    marginTop: 3,
  },
  fieldLabel: {
    fontSize: 13.5,
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 8,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 18,
  },
  fieldPrefix: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '800',
    marginRight: 7,
  },
  fieldInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
  },
  fieldSuffix: {
    fontSize: 13,
    color: COLORS.subtext,
    fontWeight: '700',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 18,
  },
  selectValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  twoColumnItem: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 12,
    color: COLORS.subtext,
    fontWeight: '700',
    marginBottom: 8,
  },
  nextButton: {
    backgroundColor: COLORS.headerFrom,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
    elevation: 3,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.18,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  nextButtonDisabled: {
    opacity: 0.42,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: hexToRgba(COLORS.danger, 0.08),
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.danger, 0.18),
    borderRadius: 15,
    padding: 13,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
  },
  resultHero: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 21,
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.gold, 0.25),
    elevation: 3,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    marginBottom: 16,
  },
  resultEyebrow: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '800',
  },
  resultValue: {
    color: COLORS.headerFrom,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
  resultSubtitle: {
    color: COLORS.subtext,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 11,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.screenBg,
    marginBottom: 14,
  },
  breakdownSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 11,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    flex: 1,
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryValue: {
    flex: 1.05,
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '900',
    textAlign: 'right',
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  insightCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },
  insightLabel: {
    color: COLORS.subtext,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 8,
  },
  insightValue: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  primaryButton: {
    backgroundColor: COLORS.headerFrom,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: COLORS.headerFrom,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  tableList: {
    flex: 1,
  },
  tableContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  amortHero: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.gold, 0.24),
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  amortHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amortHeroEyebrow: {
    color: COLORS.subtext,
    fontSize: 11.5,
    fontWeight: '800',
  },
  amortHeroTitle: {
    color: COLORS.headerFrom,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  amortHeroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: hexToRgba(COLORS.gold, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  amortProgressTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.screenBg,
    marginBottom: 13,
  },
  amortProgressPrincipal: {
    backgroundColor: COLORS.primary,
  },
  amortProgressInterest: {
    backgroundColor: COLORS.gold,
  },
  amortLegendRow: {
    flexDirection: 'row',
    gap: 10,
  },
  amortMetricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  amortMetricCard: {
    flex: 1,
    minHeight: 92,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  amortMetricIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  amortMetricLabel: {
    color: COLORS.subtext,
    fontSize: 10.5,
    fontWeight: '800',
  },
  amortMetricValue: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '900',
    marginTop: 3,
  },
  scheduleSectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },
  scheduleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: COLORS.headerFrom,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  periodBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: hexToRgba(COLORS.primary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  scheduleTitleCol: {
    flex: 1,
  },
  scheduleTitle: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '900',
  },
  scheduleSubtitle: {
    color: COLORS.subtext,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  schedulePayment: {
    color: COLORS.headerFrom,
    fontSize: 13.5,
    fontWeight: '900',
  },
  scheduleProgressTrack: {
    height: 7,
    borderRadius: 5,
    backgroundColor: COLORS.screenBg,
    overflow: 'hidden',
    marginTop: 13,
    marginBottom: 13,
  },
  scheduleProgressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  scheduleGrid: {
    flexDirection: 'row',
    gap: 9,
  },
  scheduleMetric: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 10,
  },
  scheduleMetricLabel: {
    color: COLORS.subtext,
    fontSize: 10,
    fontWeight: '800',
  },
  scheduleMetricValue: {
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: '900',
    marginTop: 4,
  },
  interestText: {
    color: COLORS.goldDark,
  },
  principalText: {
    color: COLORS.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modalRowText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoanAnalysisScreen;
