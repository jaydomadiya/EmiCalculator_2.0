import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';
import { THEME, hexToRgba } from '../theme/colors';
import { InvestmentCurrency } from '../types/investment';
import { OtherCalculatorResult, OtherCalculatorTool } from '../types/otherCalculator';
import { INVESTMENT_CURRENCIES, formatInvestmentAmount, parseMoney, tenureMonths } from '../utils/investment';
import {
  calculateBreakEvenSellPrice,
  calculateCompoundInterest,
  calculateCreditCardMinimumPayment,
  calculateCreditCardPayoff,
  getOtherCalculatorIcon,
  getOtherCalculatorTitle,
} from '../utils/otherCalculators';

type Props = {
  tool: OtherCalculatorTool;
  onBack: () => void;
};

type FormState = {
  amount: string;
  amountTwo: string;
  rate: string;
  years: string;
  months: string;
  option: string;
  currency: InvestmentCurrency;
};

const INITIAL_FORM: FormState = {
  amount: '',
  amountTwo: '',
  rate: '',
  years: '',
  months: '',
  option: 'interestPlus1',
  currency: INVESTMENT_CURRENCIES[0],
};

const MIN_PAYMENT_OPTIONS = [
  { label: 'Interest + 1% of balance', value: 'interestPlus1' },
  { label: 'Interest + 2% of balance', value: 'interestPlus2' },
  { label: '2.0% of balance', value: '2' },
  { label: '2.5% of balance', value: '2.5' },
  { label: '3.0% of balance', value: '3' },
  { label: '4.0% of balance', value: '4' },
  { label: '5.0% of balance', value: '5' },
];

const COMPOUND_OPTIONS = [
  { label: 'Monthly (12/Yr)', value: '12' },
  { label: 'Quarterly (4/Yr)', value: '4' },
  { label: 'Half Yearly (2/Yr)', value: '2' },
  { label: 'Yearly (1/Yr)', value: '1' },
];

function InputField({
  label,
  value,
  onChangeText,
  suffix,
  onPressSuffix,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  onPressSuffix?: () => void;
  helper?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor="#A9AEAB"
          keyboardType="decimal-pad"
        />
        {suffix && (
          <TouchableOpacity activeOpacity={0.75} style={styles.suffixButton} onPress={onPressSuffix}>
            <Text style={styles.suffixText}>{suffix}</Text>
            {onPressSuffix && <Icon name="chevron-down" size={21} color={THEME.subtext} />}
          </TouchableOpacity>
        )}
      </View>
      {helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}

function CurrencyMenu({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (currency: InvestmentCurrency) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <View style={styles.currencyMenu}>
      {INVESTMENT_CURRENCIES.map(item => (
        <TouchableOpacity
          key={item.code}
          activeOpacity={0.75}
          style={styles.currencyItem}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.currencyFlag}>{item.flag}</Text>
          <View style={styles.currencyCopy}>
            <Text style={styles.currencyName}>{item.name}</Text>
            <Text style={styles.currencyCountry}>{item.country}</Text>
          </View>
          <Text style={styles.currencyCode}>{item.symbol}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const selected = options.find(option => option.value === value) ?? options[0];

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity activeOpacity={0.8} style={styles.selectShell} onPress={onToggle}>
        <Text style={styles.selectText}>{selected.label}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={22} color={THEME.subtext} />
      </TouchableOpacity>
      {open && (
        <View style={styles.selectMenu}>
          {options.map(option => (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.75}
              style={styles.selectItem}
              onPress={() => onSelect(option.value)}
            >
              <Text style={styles.selectItemText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function TermFields({
  years,
  months,
  onYears,
  onMonths,
}: {
  years: string;
  months: string;
  onYears: (value: string) => void;
  onMonths: (value: string) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>Term</Text>
      <View style={styles.termRow}>
        <View style={styles.termField}>
          <Text style={styles.miniLabel}>Years</Text>
          <TextInput style={styles.termInput} value={years} onChangeText={onYears} placeholder="0" placeholderTextColor="#A9AEAB" keyboardType="decimal-pad" />
        </View>
        <View style={styles.termField}>
          <Text style={styles.miniLabel}>Months</Text>
          <TextInput style={styles.termInput} value={months} onChangeText={onMonths} placeholder="0" placeholderTextColor="#A9AEAB" keyboardType="decimal-pad" />
        </View>
      </View>
    </View>
  );
}

function ResultScreen({
  result,
  onBack,
  onDone,
}: {
  result: OtherCalculatorResult;
  onBack: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const heroValue =
    typeof result.heroValue === 'number'
      ? formatInvestmentAmount(result.heroValue, result.currency)
      : result.heroValue;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[THEME.headerFrom, THEME.headerTo]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.75} onPress={onBack}>
          <Icon name="arrow-left" size={25} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{result.title}</Text>
        <View style={styles.headerIconButton} />
      </LinearGradient>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 34 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#FFFFFF', '#EFF8F1']} style={styles.heroResultCard}>
          <View style={styles.resultTopRow}>
            <View style={styles.resultIcon}>
              <Icon name={getOtherCalculatorIcon(result.tool) as never} size={25} color={THEME.primary} />
            </View>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>{result.currency.code}</Text>
            </View>
          </View>
          <Text style={styles.resultHeroLabel}>{result.heroLabel}</Text>
          <Text style={styles.resultHeroValue}>{heroValue}</Text>
          <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
        </LinearGradient>

        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Calculation Summary</Text>
          {result.metrics.map((metric, index) => {
            const value =
              typeof metric.value === 'number'
                ? formatInvestmentAmount(metric.value, result.currency)
                : metric.value;
            const color =
              metric.tone === 'primary'
                ? THEME.primary
                : metric.tone === 'gold'
                  ? THEME.goldDark
                  : metric.tone === 'danger'
                    ? '#A84E4E'
                    : THEME.text;
            return (
              <View key={`${metric.label}-${index}`} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={[styles.metricValue, { color }]}>{value}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity activeOpacity={0.85} style={[styles.primaryButton, styles.resultDoneButton]} onPress={onDone}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

function OtherCalculatorScreen({ tool, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [result, setResult] = useState<OtherCalculatorResult | null>(null);
  const title = getOtherCalculatorTitle(tool);

  const updateForm = (patch: Partial<FormState>) => {
    setForm(current => ({ ...current, ...patch }));
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setCurrencyOpen(false);
    setSelectOpen(false);
    setResult(null);
  };

  const validate = () => {
    if (parseMoney(form.amount) <= 0) {
      Alert.alert('Add value', 'Enter a valid amount.');
      return false;
    }
    if ((tool === 'creditCardPayoff' || tool === 'creditCardMinPayment' || tool === 'compoundInterest') && parseMoney(form.rate) < 0) {
      Alert.alert('Add rate', 'Enter a valid rate.');
      return false;
    }
    if (tool === 'creditCardPayoff' && parseMoney(form.amountTwo) <= 0 && tenureMonths(form.years, form.months) <= 0) {
      Alert.alert('Add payment or time', 'Enter payment per month or desired payoff time.');
      return false;
    }
    if (tool === 'compoundInterest' && tenureMonths(form.years, form.months) <= 0) {
      Alert.alert('Add term', 'Enter term in years or months.');
      return false;
    }
    return true;
  };

  const calculate = () => {
    if (!validate()) {
      return;
    }
    if (tool === 'creditCardPayoff') {
      setResult(calculateCreditCardPayoff({
        balance: form.amount,
        annualRate: form.rate,
        monthlyPayment: form.amountTwo,
        desiredMonths: (Number(form.years || 0) * 12 + Number(form.months || 0)).toString(),
        currency: form.currency,
      }));
    } else if (tool === 'creditCardMinPayment') {
      setResult(calculateCreditCardMinimumPayment({
        balance: form.amount,
        annualRate: form.rate,
        percentMode: form.option,
        minimumAmount: form.amountTwo,
        currency: form.currency,
      }));
    } else if (tool === 'breakEvenSellPrice') {
      setResult(calculateBreakEvenSellPrice({
        buyPrice: form.amount,
        commissionRate: form.rate,
        taxRate: form.amountTwo,
        currency: form.currency,
      }));
    } else {
      setResult(calculateCompoundInterest({
        principal: form.amount,
        annualRate: form.rate,
        years: form.years,
        months: form.months,
        compoundsPerYear: form.option,
        currency: form.currency,
      }));
    }
  };

  if (result) {
    return <ResultScreen result={result} onBack={() => setResult(null)} onDone={onBack} />;
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[THEME.headerFrom, THEME.headerTo]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.75} onPress={onBack}>
          <Icon name="arrow-left" size={25} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <TouchableOpacity style={styles.resetButton} activeOpacity={0.8} onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <View style={styles.formIntroRow}>
            <View style={styles.formIntroIcon}>
              <Icon name={getOtherCalculatorIcon(tool) as never} size={22} color={THEME.primary} />
            </View>
            <View style={styles.formIntroCopy}>
              <Text style={styles.formIntroTitle}>{title}</Text>
              <Text style={styles.formIntroSubtitle}>Enter values and get a clear result summary.</Text>
            </View>
          </View>

          <View style={styles.currencyInputWrap}>
            <InputField
              label={
                tool === 'breakEvenSellPrice'
                  ? 'Buy Price per Share'
                  : tool === 'compoundInterest'
                    ? 'Initial Balance'
                    : 'Credit Card Balance'
              }
              value={form.amount}
              onChangeText={value => updateForm({ amount: value })}
              suffix={form.currency.symbol}
              onPressSuffix={() => {
                setCurrencyOpen(current => !current);
                setSelectOpen(false);
              }}
            />
            <CurrencyMenu
              open={currencyOpen}
              onSelect={currency => {
                updateForm({ currency });
                setCurrencyOpen(false);
              }}
            />
          </View>

          <InputField
            label={
              tool === 'breakEvenSellPrice'
                ? 'Commission Rate'
                : tool === 'compoundInterest'
                  ? 'Interest Rate'
                  : 'Interest Rate'
            }
            value={form.rate}
            onChangeText={value => updateForm({ rate: value })}
            suffix="%"
            helper={tool === 'compoundInterest' ? 'Yearly nominal interest rate.' : undefined}
          />

          {tool === 'creditCardPayoff' && (
            <>
              <InputField label="Payment Per Month" value={form.amountTwo} onChangeText={value => updateForm({ amountTwo: value })} suffix={form.currency.symbol} />
              <Text style={styles.orText}>Or</Text>
              <TermFields years={form.years} months={form.months} onYears={value => updateForm({ years: value })} onMonths={value => updateForm({ months: value })} />
            </>
          )}

          {tool === 'creditCardMinPayment' && (
            <>
              <Text style={styles.noteText}>Minimum payment is the higher of the percentage rule or minimum amount.</Text>
              <SelectField
                label="Minimum Percentage Monthly"
                value={form.option}
                options={MIN_PAYMENT_OPTIONS}
                open={selectOpen}
                onToggle={() => {
                  setSelectOpen(current => !current);
                  setCurrencyOpen(false);
                }}
                onSelect={value => {
                  updateForm({ option: value });
                  setSelectOpen(false);
                }}
              />
              <InputField label="Minimum Amount Monthly" value={form.amountTwo} onChangeText={value => updateForm({ amountTwo: value })} suffix={form.currency.symbol} />
            </>
          )}

          {tool === 'breakEvenSellPrice' && (
            <InputField label="Capital Gains Tax Rate" value={form.amountTwo} onChangeText={value => updateForm({ amountTwo: value })} suffix="%" />
          )}

          {tool === 'compoundInterest' && (
            <>
              <TermFields years={form.years} months={form.months} onYears={value => updateForm({ years: value })} onMonths={value => updateForm({ months: value })} />
              <SelectField
                label="Compounding Frequency"
                value={form.option}
                options={COMPOUND_OPTIONS}
                open={selectOpen}
                onToggle={() => {
                  setSelectOpen(current => !current);
                  setCurrencyOpen(false);
                }}
                onSelect={value => {
                  updateForm({ option: value });
                  setSelectOpen(false);
                }}
              />
            </>
          )}

          <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={calculate}>
            <Text style={styles.primaryButtonText}>Calculate</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.screenBg },
  header: { paddingHorizontal: 14, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '800', color: '#FFFFFF' },
  resetButton: { minWidth: 72, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  scroll: { flex: 1 },
  formContent: { paddingHorizontal: 14, paddingTop: 14 },
  formCard: { padding: 16, borderRadius: 22, backgroundColor: THEME.cardBg, borderWidth: 1, borderColor: THEME.border },
  formIntroRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 18 },
  formIntroIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: hexToRgba(THEME.primary, 0.1) },
  formIntroCopy: { flex: 1 },
  formIntroTitle: { fontSize: 15, fontWeight: '800', color: THEME.text },
  formIntroSubtitle: { marginTop: 2, fontSize: 11.5, lineHeight: 15, color: THEME.subtext },
  fieldBlock: { marginBottom: 18 },
  label: { marginBottom: 9, fontSize: 14.5, fontWeight: '800', color: THEME.text },
  inputShell: { minHeight: 56, borderWidth: 1, borderColor: THEME.border, borderRadius: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF' },
  input: { flex: 1, paddingHorizontal: 15, fontSize: 18, fontWeight: '600', color: THEME.text },
  suffixButton: { minWidth: 64, height: 54, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  suffixText: { fontSize: 17, fontWeight: '800', color: THEME.subtext },
  helper: { marginTop: 5, fontSize: 11.5, color: THEME.subtext, fontWeight: '600' },
  currencyInputWrap: { position: 'relative', zIndex: 10 },
  currencyMenu: { position: 'absolute', top: 84, right: 0, width: 306, maxHeight: 360, borderRadius: 18, paddingVertical: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: THEME.border, elevation: 10, shadowColor: THEME.headerFrom, shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, zIndex: 30 },
  currencyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 9 },
  currencyFlag: { fontSize: 25, width: 32 },
  currencyCopy: { flex: 1 },
  currencyName: { fontSize: 13.5, fontWeight: '800', color: THEME.text },
  currencyCountry: { marginTop: 1, fontSize: 10.5, fontWeight: '600', color: THEME.subtext },
  currencyCode: { fontSize: 14, fontWeight: '900', color: THEME.subtext },
  selectShell: { minHeight: 56, borderWidth: 1, borderColor: THEME.border, borderRadius: 16, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  selectText: { flex: 1, fontSize: 15.5, fontWeight: '700', color: THEME.text },
  selectMenu: { marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: THEME.border, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  selectItem: { paddingHorizontal: 15, paddingVertical: 13 },
  selectItemText: { fontSize: 14, fontWeight: '800', color: THEME.text },
  termRow: { flexDirection: 'row', gap: 12 },
  termField: { flex: 1, borderWidth: 1, borderColor: THEME.border, borderRadius: 16, paddingHorizontal: 14, paddingTop: 9, backgroundColor: '#FFFFFF' },
  miniLabel: { fontSize: 11.5, fontWeight: '700', color: THEME.subtext },
  termInput: { height: 44, fontSize: 18, fontWeight: '600', color: THEME.text },
  orText: { marginTop: -4, marginBottom: 14, textAlign: 'center', fontSize: 16, fontWeight: '900', color: THEME.text },
  noteText: { marginTop: -8, marginBottom: 14, fontSize: 12, lineHeight: 17, fontWeight: '700', color: THEME.goldDark },
  primaryButton: { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.primary },
  resultDoneButton: { marginTop: 24 },
  primaryButtonText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 15, paddingTop: 16 },
  heroResultCard: { borderRadius: 24, padding: 18, borderWidth: 1, borderColor: THEME.border },
  resultTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: hexToRgba(THEME.primary, 0.11) },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFFFFF' },
  resultBadgeText: { fontSize: 12, fontWeight: '900', color: THEME.primary },
  resultHeroLabel: { marginTop: 16, fontSize: 12, fontWeight: '800', color: THEME.subtext },
  resultHeroValue: { marginTop: 4, fontSize: 28, fontWeight: '900', color: THEME.text },
  resultSubtitle: { marginTop: 8, fontSize: 12.5, lineHeight: 18, fontWeight: '600', color: THEME.subtext },
  metricsCard: { marginTop: 14, borderRadius: 20, padding: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: THEME.border },
  metricsTitle: { marginBottom: 8, fontSize: 15, fontWeight: '900', color: THEME.text },
  metricRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: THEME.border, gap: 10 },
  metricLabel: { flex: 1, fontSize: 12.5, fontWeight: '700', color: THEME.subtext },
  metricValue: { flex: 1, textAlign: 'right', fontSize: 13.5, fontWeight: '900' },
});

export default OtherCalculatorScreen;
