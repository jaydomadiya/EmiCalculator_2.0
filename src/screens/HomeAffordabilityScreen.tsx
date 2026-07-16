import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
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
  danger: '#B95555',
};

type Result = {
  homePrice: number;
  loanAmount: number;
  monthlyHousing: number;
  principalInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  annualPayment: number;
  dtiUsed: number;
};

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

function loanPrincipalFromPayment(payment: number, annualRate: number, months: number): number {
  if (payment <= 0 || months <= 0) {
    return 0;
  }
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate <= 0) {
    return payment * months;
  }
  return payment * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function MoneyField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
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

function NumberField({
  value,
  onChangeText,
  suffix,
}: {
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
}) {
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

function ResultRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.resultRow, !isLast && styles.resultRowBorder]}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function HomeAffordabilityScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<'form' | 'result'>('form');
  const [annualIncome, setAnnualIncome] = useState('100000');
  const [monthlyDebts, setMonthlyDebts] = useState('500');
  const [downPayment, setDownPayment] = useState('10000');
  const [rate, setRate] = useState('5');
  const [tenureMonths, setTenureMonths] = useState('360');
  const [dti, setDti] = useState('36');
  const [propertyTax, setPropertyTax] = useState('10000');
  const [insurance, setInsurance] = useState('1000');
  const [hasCalculated, setHasCalculated] = useState(false);

  const result = useMemo<Result | null>(() => {
    const income = Number(annualIncome);
    const debts = Number(monthlyDebts);
    const down = Number(downPayment);
    const months = Number(tenureMonths);
    const dtiPercent = Number(dti);
    const monthlyTax = Number(propertyTax) / 12;
    const monthlyInsurance = Number(insurance) / 12;
    const maxDebtPayment = (income / 12) * (dtiPercent / 100);
    const monthlyHousing = maxDebtPayment - debts;
    const principalInterest = monthlyHousing - monthlyTax - monthlyInsurance;
    const loanAmount = loanPrincipalFromPayment(principalInterest, Number(rate), months);
    const homePrice = loanAmount + down;

    if (income <= 0 || months <= 0 || dtiPercent <= 0 || principalInterest <= 0) {
      return null;
    }

    return {
      homePrice,
      loanAmount,
      monthlyHousing,
      principalInterest,
      monthlyTax,
      monthlyInsurance,
      annualPayment: monthlyHousing * 12,
      dtiUsed: income > 0 ? ((monthlyHousing + debts) / (income / 12)) * 100 : 0,
    };
  }, [annualIncome, downPayment, dti, insurance, monthlyDebts, propertyTax, rate, tenureMonths]);

  const handleReset = () => {
    setAnnualIncome('');
    setMonthlyDebts('');
    setDownPayment('');
    setRate('');
    setTenureMonths('');
    setDti('');
    setPropertyTax('');
    setInsurance('');
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

  const handleCalculate = () => {
    setHasCalculated(true);
    if (result) {
      setScreen('result');
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Icon name="home-search-outline" size={132} color="rgba(255,255,255,0.07)" style={styles.headerWatermark} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {screen === 'result' ? 'Affordability Result' : 'Home Affordability'}
          </Text>
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
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}><Icon name="home-percent-outline" size={24} color={COLORS.goldDark} /></View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Know your buying range</Text>
              <Text style={styles.heroSubtitle}>Uses income, debt, taxes, insurance and DTI to estimate a safe home price.</Text>
            </View>
          </View>

          <FieldLabel>Annual Income</FieldLabel>
          <MoneyField value={annualIncome} onChangeText={setAnnualIncome} />
          <FieldLabel>Monthly Debts</FieldLabel>
          <MoneyField value={monthlyDebts} onChangeText={setMonthlyDebts} />
          <FieldLabel>Down Payment</FieldLabel>
          <MoneyField value={downPayment} onChangeText={setDownPayment} />
          <FieldLabel>Annual Interest Rate</FieldLabel>
          <NumberField value={rate} onChangeText={setRate} suffix="%/year" />
          <FieldLabel>Loan Tenure</FieldLabel>
          <NumberField value={tenureMonths} onChangeText={text => setTenureMonths(digitsOnly(text))} suffix="Months" />
          <FieldLabel>Debt-to-income Ratio</FieldLabel>
          <NumberField value={dti} onChangeText={setDti} suffix="%" />
          <FieldLabel>Annual Property Tax</FieldLabel>
          <MoneyField value={propertyTax} onChangeText={setPropertyTax} />
          <FieldLabel>Annual Insurance</FieldLabel>
          <MoneyField value={insurance} onChangeText={setInsurance} />

          <TouchableOpacity style={styles.calculateButton} activeOpacity={0.85} onPress={handleCalculate}>
            <Icon name="calculator-variant-outline" size={19} color="#FFFFFF" />
            <Text style={styles.calculateButtonText}>Calculate</Text>
          </TouchableOpacity>

          {hasCalculated && !result && (
            <View style={styles.errorCard}>
              <Icon name="alert-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>Income and DTI are not enough after debts, tax and insurance. Increase income/down payment or lower expenses.</Text>
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
              <Icon name="check-circle-outline" size={28} color={COLORS.goldDark} />
            </View>
            <Text style={styles.resultEyebrow}>Affordable home price</Text>
            <Text style={styles.resultHeroValue}>{money(result.homePrice)}</Text>
            <Text style={styles.resultHeroSub}>Estimated with {result.dtiUsed.toFixed(1)}% DTI usage</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Monthly Payment</Text>
              <Text style={styles.metricValue}>{money(result.monthlyHousing)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Loan Amount</Text>
              <Text style={styles.metricValue}>{money(result.loanAmount)}</Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <ResultRow label="Principal & Interest" value={money(result.principalInterest)} />
            <ResultRow label="Property Tax / Month" value={money(result.monthlyTax)} />
            <ResultRow label="Insurance / Month" value={money(result.monthlyInsurance)} />
            <ResultRow label="Annual Payment" value={money(result.annualPayment)} isLast />
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
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: hexToRgba(COLORS.primary, 0.12), backgroundColor: COLORS.cardBg, marginBottom: 18 },
  heroIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: hexToRgba(COLORS.gold, 0.15), alignItems: 'center', justifyContent: 'center' },
  heroTextCol: { flex: 1 },
  heroTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  heroSubtitle: { color: COLORS.subtext, fontSize: 12, lineHeight: 16, marginTop: 3 },
  fieldLabel: { color: COLORS.text, fontSize: 13.5, fontWeight: '800', marginBottom: 8 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 15, backgroundColor: COLORS.cardBg, paddingHorizontal: 15, paddingVertical: 13, marginBottom: 18 },
  prefix: { color: COLORS.primary, fontSize: 15, fontWeight: '800', marginRight: 7 },
  suffix: { color: COLORS.subtext, fontSize: 13, fontWeight: '700' },
  fieldInput: { flex: 1, padding: 0, color: COLORS.text, fontSize: 16, fontWeight: '700' },
  calculateButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.headerFrom, borderRadius: 16, paddingVertical: 17, marginTop: 4, marginBottom: 16 },
  calculateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  resultHero: { backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: hexToRgba(COLORS.gold, 0.25), padding: 20, marginBottom: 14, elevation: 3, shadowColor: COLORS.headerFrom, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  resultIconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: hexToRgba(COLORS.gold, 0.16), alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  resultEyebrow: { color: COLORS.subtext, fontSize: 12, fontWeight: '800' },
  resultHeroValue: { color: COLORS.headerFrom, fontSize: 31, fontWeight: '900', marginTop: 4 },
  resultHeroSub: { color: COLORS.subtext, fontSize: 12.5, marginTop: 4 },
  metricRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  metricCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 15 },
  metricLabel: { color: COLORS.subtext, fontSize: 11.5, fontWeight: '800' },
  metricValue: { color: COLORS.text, fontSize: 15, fontWeight: '900', marginTop: 5 },
  resultCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11 },
  resultRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultLabel: { flex: 1, color: COLORS.subtext, fontSize: 13, fontWeight: '700' },
  resultValue: { flex: 1, color: COLORS.text, fontSize: 13.5, fontWeight: '900', textAlign: 'right' },
  errorCard: { flexDirection: 'row', gap: 9, alignItems: 'center', borderRadius: 15, padding: 13, backgroundColor: hexToRgba(COLORS.danger, 0.08), borderWidth: 1, borderColor: hexToRgba(COLORS.danger, 0.18) },
  errorText: { flex: 1, color: COLORS.danger, fontSize: 12.5, fontWeight: '700', lineHeight: 17 },
  doneButton: { backgroundColor: COLORS.headerFrom, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});

export default HomeAffordabilityScreen;
