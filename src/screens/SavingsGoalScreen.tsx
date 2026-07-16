import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  rose: '#B5657D',
};

type Mode = 'monthly' | 'time';
type Compound = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'none';

type Result = {
  primaryLabel: string;
  primaryValue: string;
  goal: number;
  initial: number;
  months: number;
  monthlySavings: number;
  totalSaved: number;
  interestEarned: number;
  finalBalance: number;
};

const COMPOUNDS: Array<{ label: string; value: Compound; periods: number }> = [
  { label: 'Daily', value: 'daily', periods: 365 },
  { label: 'Weekly', value: 'weekly', periods: 52 },
  { label: 'Monthly', value: 'monthly', periods: 12 },
  { label: 'Quarterly', value: 'quarterly', periods: 4 },
  { label: 'Semiannually', value: 'semiannual', periods: 2 },
  { label: 'Annually', value: 'annual', periods: 1 },
  { label: 'No Compound', value: 'none', periods: 0 },
];

type Props = {
  onBack: () => void;
};

function digitsOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

function decimalOnly(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
}

function formatInput(raw: string): string {
  const digits = digitsOnly(raw);
  return digits ? Number(digits).toLocaleString('en-IN') : '';
}

function money(value: number): string {
  return `₹${Math.round(Math.max(value, 0)).toLocaleString('en-IN')}`;
}

function termLabel(months: number): string {
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (years <= 0) {
    return `${remaining} Months`;
  }
  if (remaining <= 0) {
    return `${years} Years`;
  }
  return `${years} Years ${remaining} Months`;
}

function monthlyRate(annualRate: number, compound: Compound): number {
  const selected = COMPOUNDS.find(item => item.value === compound) ?? COMPOUNDS[2];
  if (annualRate <= 0 || selected.periods <= 0) {
    return 0;
  }
  return Math.pow(1 + annualRate / 100 / selected.periods, selected.periods / 12) - 1;
}

function futureValue(initial: number, monthly: number, rate: number, months: number): number {
  if (months <= 0) {
    return initial;
  }
  if (rate <= 0) {
    return initial + monthly * months;
  }
  return initial * Math.pow(1 + rate, months) + monthly * ((Math.pow(1 + rate, months) - 1) / rate);
}

function requiredMonthly(goal: number, initial: number, rate: number, months: number): number {
  if (months <= 0) {
    return 0;
  }
  if (rate <= 0) {
    return Math.max((goal - initial) / months, 0);
  }
  const initialGrowth = initial * Math.pow(1 + rate, months);
  const factor = (Math.pow(1 + rate, months) - 1) / rate;
  return Math.max((goal - initialGrowth) / factor, 0);
}

function monthsNeeded(goal: number, initial: number, monthly: number, rate: number): number {
  if (goal <= initial) {
    return 0;
  }
  if (monthly <= 0 && rate <= 0) {
    return 0;
  }
  for (let month = 1; month <= 1200; month += 1) {
    if (futureValue(initial, monthly, rate, month) >= goal) {
      return month;
    }
  }
  return 0;
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function MoneyField({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.prefix}>₹</Text>
      <TextInput
        style={styles.fieldInput}
        value={formatInput(value)}
        onChangeText={text => onChangeText(digitsOnly(text))}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={COLORS.subtext}
      />
    </View>
  );
}

function NumberField({ value, onChangeText, suffix }: { value: string; onChangeText: (value: string) => void; suffix?: string }) {
  return (
    <View style={styles.fieldBox}>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={text => onChangeText(decimalOnly(text))}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={COLORS.subtext}
      />
      {suffix && <Text style={styles.suffix}>{suffix}</Text>}
    </View>
  );
}

function CompoundSelect({ value, onChange }: { value: Compound; onChange: (value: Compound) => void }) {
  const [visible, setVisible] = useState(false);
  const selected = COMPOUNDS.find(item => item.value === value) ?? COMPOUNDS[2];

  return (
    <>
      <FieldLabel>Compounding</FieldLabel>
      <TouchableOpacity style={styles.selectBox} activeOpacity={0.75} onPress={() => setVisible(true)}>
        <Text style={styles.selectValue}>{selected.label}</Text>
        <Icon name="chevron-down" size={22} color={COLORS.subtext} />
      </TouchableOpacity>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalSheet}>
            {COMPOUNDS.map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalRow}
                activeOpacity={0.75}
                onPress={() => {
                  onChange(item.value);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalRowText}>{item.label}</Text>
                {item.value === value && <Icon name="check" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function ResultRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.resultRow, !isLast && styles.resultRowBorder]}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function SavingsGoalScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<'form' | 'result'>('form');
  const [mode, setMode] = useState<Mode>('monthly');
  const [goal, setGoal] = useState('');
  const [initial, setInitial] = useState('');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const [monthly, setMonthly] = useState('');
  const [rate, setRate] = useState('');
  const [compound, setCompound] = useState<Compound>('monthly');
  const [hasCalculated, setHasCalculated] = useState(false);

  const result = useMemo<Result | null>(() => {
    const target = Number(goal);
    const start = Number(initial);
    const r = monthlyRate(Number(rate), compound);

    if (target <= 0 || start >= target) {
      return null;
    }

    if (mode === 'monthly') {
      const totalMonths = Math.round(Number(years) * 12 + Number(months));
      if (totalMonths <= 0) {
        return null;
      }
      const monthlySavings = requiredMonthly(target, start, r, totalMonths);
      const finalBalance = futureValue(start, monthlySavings, r, totalMonths);
      const totalSaved = start + monthlySavings * totalMonths;
      return {
        primaryLabel: 'Monthly savings needed',
        primaryValue: money(monthlySavings),
        goal: target,
        initial: start,
        months: totalMonths,
        monthlySavings,
        totalSaved,
        interestEarned: Math.max(finalBalance - totalSaved, 0),
        finalBalance,
      };
    }

    const monthlySavings = Number(monthly);
    const totalMonths = monthsNeeded(target, start, monthlySavings, r);
    if (monthlySavings <= 0 || totalMonths <= 0) {
      return null;
    }
    const finalBalance = futureValue(start, monthlySavings, r, totalMonths);
    const totalSaved = start + monthlySavings * totalMonths;
    return {
      primaryLabel: 'Time needed',
      primaryValue: termLabel(totalMonths),
      goal: target,
      initial: start,
      months: totalMonths,
      monthlySavings,
      totalSaved,
      interestEarned: Math.max(finalBalance - totalSaved, 0),
      finalBalance,
    };
  }, [compound, goal, initial, mode, monthly, months, rate, years]);

  const handleReset = () => {
    setGoal('');
    setInitial('');
    setYears('');
    setMonths('');
    setMonthly('');
    setRate('');
    setCompound('monthly');
    setHasCalculated(false);
    setScreen('form');
  };

  const handleBack = () => {
    if (screen === 'result') {
      setScreen('form');
      return;
    }
    onBack();
  };

  const handleNext = () => {
    setHasCalculated(true);
    if (result) {
      setScreen('result');
    }
  };

  const progress = result ? Math.min((result.initial / result.goal) * 100, 100) : 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Icon name="piggy-bank-outline" size={132} color="rgba(255,255,255,0.07)" style={styles.headerWatermark} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{screen === 'result' ? 'Savings Result' : 'Savings Goal'}</Text>
          {screen === 'form' ? (
            <TouchableOpacity onPress={handleReset} activeOpacity={0.8} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
        </View>
      </LinearGradient>

      {screen === 'form' && (
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
          extraKeyboardSpace={34}
        >
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segmentButton, mode === 'monthly' && styles.segmentButtonActive]}
              activeOpacity={0.8}
              onPress={() => setMode('monthly')}
            >
              <Text style={[styles.segmentText, mode === 'monthly' && styles.segmentTextActive]}>Monthly Savings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, mode === 'time' && styles.segmentButtonActive]}
              activeOpacity={0.8}
              onPress={() => setMode('time')}
            >
              <Text style={[styles.segmentText, mode === 'time' && styles.segmentTextActive]}>Time Needed</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroIcon}><Icon name="target" size={24} color={COLORS.rose} /></View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Turn goals into a plan</Text>
              <Text style={styles.heroSubtitle}>Estimate monthly savings or how long your existing savings plan will take.</Text>
            </View>
          </View>

          <FieldLabel>Savings Goal</FieldLabel>
          <MoneyField value={goal} onChangeText={setGoal} />
          <FieldLabel>Initial Balance</FieldLabel>
          <MoneyField value={initial} onChangeText={setInitial} />

          {mode === 'monthly' ? (
            <>
              <FieldLabel>Time To Grow</FieldLabel>
              <View style={styles.twoColumnRow}>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.smallLabel}>Year</Text>
                  <NumberField value={years} onChangeText={text => setYears(digitsOnly(text))} />
                </View>
                <View style={styles.twoColumnItem}>
                  <Text style={styles.smallLabel}>Month</Text>
                  <NumberField value={months} onChangeText={text => setMonths(digitsOnly(text))} />
                </View>
              </View>
            </>
          ) : (
            <>
              <FieldLabel>Monthly Savings</FieldLabel>
              <MoneyField value={monthly} onChangeText={setMonthly} />
            </>
          )}

          <FieldLabel>Annual Interest Rate</FieldLabel>
          <NumberField value={rate} onChangeText={setRate} suffix="%" />
          <CompoundSelect value={compound} onChange={setCompound} />

          <TouchableOpacity style={styles.nextButton} activeOpacity={0.85} onPress={handleNext}>
            <Icon name="chart-areaspline" size={19} color="#FFFFFF" />
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>

          {hasCalculated && !result && (
            <View style={styles.errorCard}>
              <Icon name="alert-circle-outline" size={18} color={COLORS.rose} />
              <Text style={styles.errorText}>Please enter a goal higher than initial balance and valid time or monthly savings.</Text>
            </View>
          )}
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
      )}

      {screen === 'result' && result && (
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultHero}>
            <View style={styles.resultIconCircle}>
              <Icon name="piggy-bank-outline" size={29} color={COLORS.rose} />
            </View>
            <Text style={styles.resultEyebrow}>{result.primaryLabel}</Text>
            <Text style={styles.resultHeroValue}>{result.primaryValue}</Text>
            <Text style={styles.resultHeroSub}>Goal {money(result.goal)} in {termLabel(result.months)}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Interest Earned</Text>
              <Text style={styles.metricValue}>{money(result.interestEarned)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Final Balance</Text>
              <Text style={styles.metricValue}>{money(result.finalBalance)}</Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <ResultRow label="Monthly Savings" value={money(result.monthlySavings)} />
            <ResultRow label="Total Contributions" value={money(result.totalSaved)} />
            <ResultRow label="Initial Balance" value={money(result.initial)} />
            <ResultRow label="Time Period" value={termLabel(result.months)} isLast />
          </View>

          <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={onBack}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.screenBg },
  header: { paddingHorizontal: 12, paddingBottom: 20, overflow: 'hidden' },
  headerWatermark: { position: 'absolute', top: -22, right: -18 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginLeft: 4 },
  resetButton: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.64)', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 7 },
  resetButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  keyboardAvoider: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  segmentRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  segmentButton: { flex: 1, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.cardBg, paddingVertical: 15, alignItems: 'center' },
  segmentButtonActive: { borderColor: COLORS.gold, backgroundColor: '#FFFDF8' },
  segmentText: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  segmentTextActive: { color: COLORS.headerFrom },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: hexToRgba(COLORS.rose, 0.16), backgroundColor: COLORS.cardBg, marginBottom: 18 },
  heroIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: hexToRgba(COLORS.rose, 0.12), alignItems: 'center', justifyContent: 'center' },
  heroTextCol: { flex: 1 },
  heroTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  heroSubtitle: { color: COLORS.subtext, fontSize: 12, lineHeight: 16, marginTop: 3 },
  fieldLabel: { color: COLORS.text, fontSize: 13.5, fontWeight: '800', marginBottom: 8 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 15, backgroundColor: COLORS.cardBg, paddingHorizontal: 15, paddingVertical: 13, marginBottom: 18 },
  prefix: { color: COLORS.primary, fontSize: 15, fontWeight: '800', marginRight: 7 },
  suffix: { color: COLORS.subtext, fontSize: 13, fontWeight: '700' },
  fieldInput: { flex: 1, padding: 0, color: COLORS.text, fontSize: 16, fontWeight: '700' },
  twoColumnRow: { flexDirection: 'row', gap: 12 },
  twoColumnItem: { flex: 1 },
  smallLabel: { color: COLORS.subtext, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  selectBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 15, backgroundColor: COLORS.cardBg, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 18 },
  selectValue: { flex: 1, color: COLORS.text, fontSize: 14.5, fontWeight: '700' },
  nextButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.headerFrom, borderRadius: 16, paddingVertical: 17, marginTop: 4, marginBottom: 16 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  resultHero: { backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: hexToRgba(COLORS.gold, 0.25), padding: 20, marginBottom: 14, elevation: 3, shadowColor: COLORS.headerFrom, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  resultIconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: hexToRgba(COLORS.rose, 0.12), alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  resultEyebrow: { color: COLORS.subtext, fontSize: 12, fontWeight: '800' },
  resultHeroValue: { color: COLORS.headerFrom, fontSize: 31, fontWeight: '900', marginTop: 4 },
  resultHeroSub: { color: COLORS.subtext, fontSize: 12.5, marginTop: 4, marginBottom: 14 },
  progressTrack: { height: 10, borderRadius: 7, backgroundColor: COLORS.screenBg, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 7, backgroundColor: COLORS.rose },
  metricRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  metricCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 15 },
  metricLabel: { color: COLORS.subtext, fontSize: 11.5, fontWeight: '800' },
  metricValue: { color: COLORS.text, fontSize: 15, fontWeight: '900', marginTop: 5 },
  resultCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11 },
  resultRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultLabel: { flex: 1, color: COLORS.subtext, fontSize: 13, fontWeight: '700' },
  resultValue: { flex: 1, color: COLORS.text, fontSize: 13.5, fontWeight: '900', textAlign: 'right' },
  errorCard: { flexDirection: 'row', gap: 9, alignItems: 'center', borderRadius: 15, padding: 13, backgroundColor: hexToRgba(COLORS.rose, 0.08), borderWidth: 1, borderColor: hexToRgba(COLORS.rose, 0.18) },
  errorText: { flex: 1, color: COLORS.rose, fontSize: 12.5, fontWeight: '700', lineHeight: 17 },
  doneButton: { backgroundColor: COLORS.headerFrom, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', paddingHorizontal: 28 },
  modalSheet: { backgroundColor: COLORS.cardBg, borderRadius: 18, paddingVertical: 10, elevation: 8, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  modalRowText: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '700' },
});

export default SavingsGoalScreen;
