import { useMemo, useState } from 'react';
import {
  Alert,
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
import { InvestmentCurrency, InvestmentResult, InvestmentTool } from '../types/investment';
import {
  INVESTMENT_CURRENCIES,
  calculateFixedDeposit,
  calculateRecurringDeposit,
  calculateRoi,
  calculateSip,
  formatInvestmentAmount,
  getInvestmentTitle,
  parseMoney,
  tenureMonths,
} from '../utils/investment';

type Props = {
  tool: InvestmentTool;
  onBack: () => void;
};

type FormState = {
  amount: string;
  amountTwo: string;
  rate: string;
  years: string;
  months: string;
  compounding: string;
  currency: InvestmentCurrency;
};

const INITIAL_FORM: FormState = {
  amount: '',
  amountTwo: '',
  rate: '',
  years: '',
  months: '',
  compounding: '4',
  currency: INVESTMENT_CURRENCIES[0],
};

const COMPOUND_OPTIONS = [
  { label: 'Monthly', value: '12' },
  { label: 'Quarterly', value: '4' },
  { label: 'Half Yearly', value: '2' },
  { label: 'Yearly', value: '1' },
];

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function numericValue(value: string): number {
  return parseMoney(value);
}

function getToolIcon(tool: InvestmentTool): string {
  switch (tool) {
    case 'fixedDeposit':
      return 'bank-outline';
    case 'recurringDeposit':
      return 'calendar-sync-outline';
    case 'sipCalculator':
      return 'chart-donut';
    case 'returnOnInvestment':
      return 'trending-up';
    default:
      return 'chart-line';
  }
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder = '0',
  suffix,
  onPressSuffix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  onPressSuffix?: () => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
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
    </View>
  );
}

function CurrencyPicker({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (currency: InvestmentCurrency) => void;
}) {
  return (
    <View style={styles.currencyWrap}>
      {open && (
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
      )}
    </View>
  );
}

function CompoundingPicker({
  value,
  open,
  onToggle,
  onSelect,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const selected = COMPOUND_OPTIONS.find(option => option.value === value) ?? COMPOUND_OPTIONS[1];

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>Compounding Frequency</Text>
      <TouchableOpacity activeOpacity={0.8} style={styles.selectShell} onPress={onToggle}>
        <Text style={styles.selectText}>{selected.label}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={22} color={THEME.subtext} />
      </TouchableOpacity>
      {open && (
        <View style={styles.selectMenu}>
          {COMPOUND_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.75}
              style={styles.selectItem}
              onPress={() => onSelect(option.value)}
            >
              <Text style={styles.selectItemText}>{option.label}</Text>
              <Text style={styles.selectItemMeta}>{option.value}x / year</Text>
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
      <Text style={styles.label}>Investment Period</Text>
      <View style={styles.termRow}>
        <View style={styles.termField}>
          <Text style={styles.miniLabel}>Years</Text>
          <TextInput
            style={styles.termInput}
            value={years}
            onChangeText={onYears}
            placeholder="0"
            placeholderTextColor="#A9AEAB"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.termField}>
          <Text style={styles.miniLabel}>Months</Text>
          <TextInput
            style={styles.termInput}
            value={months}
            onChangeText={onMonths}
            placeholder="0"
            placeholderTextColor="#A9AEAB"
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
}

function ResultMetric({
  label,
  value,
  currency,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  currency: InvestmentCurrency;
  tone?: 'primary' | 'gold' | 'neutral';
}) {
  const color = tone === 'primary' ? THEME.primary : tone === 'gold' ? THEME.goldDark : THEME.text;
  const displayValue = typeof value === 'number' ? formatInvestmentAmount(value, currency) : value;

  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{displayValue}</Text>
    </View>
  );
}

function InvestmentResultView({
  result,
  onBack,
  onDone,
}: {
  result: InvestmentResult;
  onBack: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const returnPercent =
    result.investedAmount > 0 ? (result.gainAmount / result.investedAmount) * 100 : 0;
  const positive = result.gainAmount >= 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[THEME.headerFrom, THEME.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
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
        <LinearGradient
          colors={['#FFFFFF', '#EFF8F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroResultCard}
        >
          <View style={styles.resultTopRow}>
            <View style={styles.resultIcon}>
              <Icon name="chart-timeline-variant" size={25} color={THEME.primary} />
            </View>
            <View style={styles.resultBadge}>
              <Icon
                name={positive ? 'arrow-up-right' : 'arrow-down-right'}
                size={15}
                color={positive ? THEME.primary : '#A84E4E'}
              />
              <Text style={[styles.resultBadgeText, !positive && styles.resultBadgeLoss]}>
                {returnPercent.toFixed(2)}%
              </Text>
            </View>
          </View>
          <Text style={styles.resultHeroLabel}>Maturity / Ending Value</Text>
          <Text style={styles.resultHeroValue}>
            {formatInvestmentAmount(result.maturityValue, result.currency)}
          </Text>
          <View style={styles.resultSplitRow}>
            <View>
              <Text style={styles.resultSmallLabel}>Invested</Text>
              <Text style={styles.resultSmallValue}>
                {formatInvestmentAmount(result.investedAmount, result.currency)}
              </Text>
            </View>
            <View style={styles.resultDivider} />
            <View>
              <Text style={styles.resultSmallLabel}>Gain</Text>
              <Text style={[styles.resultSmallValue, !positive && styles.resultLoss]}>
                {positive ? '' : '-'}
                {formatInvestmentAmount(Math.abs(result.gainAmount), result.currency)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.resultMetaGrid}>
          <View style={styles.resultMetaCard}>
            <Icon name="calendar-range" size={20} color={THEME.goldDark} />
            <Text style={styles.resultMetaLabel}>Duration</Text>
            <Text style={styles.resultMetaValue}>{result.durationLabel}</Text>
          </View>
          <View style={styles.resultMetaCard}>
            <Icon name="percent-outline" size={20} color={THEME.goldDark} />
            <Text style={styles.resultMetaLabel}>Rate</Text>
            <Text style={styles.resultMetaValue}>{result.rateLabel}</Text>
          </View>
        </View>

        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Calculation Summary</Text>
          {result.metrics.map((metric, index) => (
            <ResultMetric
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              currency={result.currency}
              tone={metric.tone}
            />
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.85} style={[styles.primaryButton, styles.resultDoneButton]} onPress={onDone}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

function InvestmentCalculatorScreen({ tool, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [compoundOpen, setCompoundOpen] = useState(false);
  const [result, setResult] = useState<InvestmentResult | null>(null);

  const title = getInvestmentTitle(tool);
  const startDate = useMemo(() => todayLabel(), []);

  const updateForm = (patch: Partial<FormState>) => {
    setForm(current => ({ ...current, ...patch }));
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setCurrencyOpen(false);
    setCompoundOpen(false);
    setResult(null);
  };

  const validate = (): boolean => {
    if (tool === 'returnOnInvestment') {
      if (numericValue(form.amount) <= 0 || numericValue(form.amountTwo) <= 0) {
        Alert.alert('Add investment values', 'Enter original and ending investment values.');
        return false;
      }
    } else if (numericValue(form.amount) <= 0) {
      Alert.alert('Add amount', 'Enter a valid investment amount.');
      return false;
    }

    if (tool !== 'returnOnInvestment' && numericValue(form.rate) <= 0) {
      Alert.alert('Add rate', 'Enter a valid annual interest or return rate.');
      return false;
    }

    if (tenureMonths(form.years, form.months) <= 0) {
      Alert.alert('Add period', 'Enter investment period in years or months.');
      return false;
    }

    return true;
  };

  const calculate = () => {
    if (!validate()) {
      return;
    }

    if (tool === 'fixedDeposit') {
      setResult(
        calculateFixedDeposit({
          principal: form.amount,
          annualRate: form.rate,
          years: form.years,
          months: form.months,
          compoundsPerYear: Number(form.compounding),
          currency: form.currency,
        }),
      );
    } else if (tool === 'recurringDeposit') {
      setResult(
        calculateRecurringDeposit({
          monthlyInvestment: form.amount,
          annualRate: form.rate,
          years: form.years,
          months: form.months,
          currency: form.currency,
        }),
      );
    } else if (tool === 'sipCalculator') {
      setResult(
        calculateSip({
          monthlySip: form.amount,
          annualRate: form.rate,
          years: form.years,
          months: form.months,
          currency: form.currency,
        }),
      );
    } else {
      setResult(
        calculateRoi({
          originalInvestment: form.amount,
          endingInvestment: form.amountTwo,
          years: form.years,
          months: form.months,
          currency: form.currency,
        }),
      );
    }
  };

  if (result) {
    return (
      <InvestmentResultView
        result={result}
        onBack={() => setResult(null)}
        onDone={onBack}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[THEME.headerFrom, THEME.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.75} onPress={onBack}>
          <Icon name="arrow-left" size={25} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Icon name={getToolIcon(tool) as never} size={22} color="#F7EBC3" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
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
              <Icon name={getToolIcon(tool) as never} size={22} color={THEME.primary} />
            </View>
            <View style={styles.formIntroCopy}>
              <Text style={styles.formIntroTitle}>{title}</Text>
              <Text style={styles.formIntroSubtitle}>Enter values and view a clean result summary.</Text>
            </View>
          </View>

          <View style={styles.currencyInputWrap}>
            <InputField
              label={
                tool === 'recurringDeposit'
                  ? 'Monthly Investment Amount'
                  : tool === 'sipCalculator'
                    ? 'Monthly SIP Amount'
                    : tool === 'returnOnInvestment'
                      ? 'Original Investment'
                      : 'Investment Amount'
              }
              value={form.amount}
              onChangeText={value => updateForm({ amount: value })}
              suffix={form.currency.symbol}
              onPressSuffix={() => {
                setCurrencyOpen(current => !current);
                setCompoundOpen(false);
              }}
            />
            <CurrencyPicker
              open={currencyOpen}
              onSelect={currency => {
                updateForm({ currency });
                setCurrencyOpen(false);
              }}
            />
          </View>

          {tool === 'returnOnInvestment' && (
            <InputField
              label="Ending Investment"
              value={form.amountTwo}
              onChangeText={value => updateForm({ amountTwo: value })}
              suffix={form.currency.symbol}
            />
          )}

          {tool !== 'returnOnInvestment' && (
            <InputField
              label={
                tool === 'sipCalculator'
                  ? 'Expected Rate Of Return'
                  : tool === 'recurringDeposit'
                    ? 'Expected Interest Rate'
                    : 'Interest Rate'
              }
              value={form.rate}
              onChangeText={value => updateForm({ rate: value })}
              suffix="%"
            />
          )}

          <TermFields
            years={form.years}
            months={form.months}
            onYears={value => updateForm({ years: value })}
            onMonths={value => updateForm({ months: value })}
          />

          {tool === 'fixedDeposit' && (
            <CompoundingPicker
              value={form.compounding}
              open={compoundOpen}
              onToggle={() => {
                setCompoundOpen(current => !current);
                setCurrencyOpen(false);
              }}
              onSelect={value => {
                updateForm({ compounding: value });
                setCompoundOpen(false);
              }}
            />
          )}

          <View style={styles.dateCard}>
            <View>
              <Text style={styles.dateLabel}>{tool === 'returnOnInvestment' ? 'Calculation Date' : 'Start Date'}</Text>
              <Text style={styles.dateValue}>{startDate}</Text>
            </View>
            <Icon name="calendar-month-outline" size={24} color={THEME.primary} />
          </View>

          <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={calculate}>
            <Text style={styles.primaryButtonText}>{tool === 'returnOnInvestment' ? 'Calculate' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.screenBg,
  },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resetButton: {
    minWidth: 72,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  formCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  formIntroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 18,
  },
  formIntroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(THEME.primary, 0.1),
  },
  formIntroCopy: {
    flex: 1,
  },
  formIntroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text,
  },
  formIntroSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    lineHeight: 15,
    color: THEME.subtext,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 9,
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.text,
  },
  inputShell: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
  },
  suffixButton: {
    minWidth: 64,
    height: 54,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  suffixText: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.subtext,
  },
  currencyInputWrap: {
    position: 'relative',
    zIndex: 10,
  },
  currencyWrap: {
    position: 'absolute',
    right: 0,
    top: 84,
    zIndex: 20,
  },
  currencyMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 306,
    maxHeight: 360,
    borderRadius: 18,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 10,
    shadowColor: THEME.headerFrom,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  currencyFlag: {
    fontSize: 25,
    width: 32,
  },
  currencyCopy: {
    flex: 1,
  },
  currencyName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.text,
  },
  currencyCountry: {
    marginTop: 1,
    fontSize: 10.5,
    fontWeight: '600',
    color: THEME.subtext,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.subtext,
  },
  termRow: {
    flexDirection: 'row',
    gap: 12,
  },
  termField: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 9,
    backgroundColor: '#FFFFFF',
  },
  miniLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.subtext,
  },
  termInput: {
    height: 44,
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
  },
  selectShell: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  selectText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  selectMenu: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  selectItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectItemText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.text,
  },
  selectItemMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.subtext,
  },
  dateCard: {
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: hexToRgba(THEME.primary, 0.06),
    borderWidth: 1,
    borderColor: hexToRgba(THEME.primary, 0.11),
  },
  dateLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: THEME.subtext,
  },
  dateValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text,
  },
  primaryButton: {
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
  },
  resultDoneButton: {
    marginTop: 24,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  heroResultCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(THEME.primary, 0.11),
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.primary,
  },
  resultBadgeLoss: {
    color: '#A84E4E',
  },
  resultHeroLabel: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '800',
    color: THEME.subtext,
  },
  resultHeroValue: {
    marginTop: 4,
    fontSize: 29,
    fontWeight: '900',
    color: THEME.text,
  },
  resultSplitRow: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: THEME.border,
  },
  resultSmallLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.subtext,
  },
  resultSmallValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '900',
    color: THEME.primary,
  },
  resultLoss: {
    color: '#A84E4E',
  },
  resultMetaGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  resultMetaCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  resultMetaLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '800',
    color: THEME.subtext,
  },
  resultMetaValue: {
    marginTop: 3,
    fontSize: 13.5,
    fontWeight: '900',
    color: THEME.text,
  },
  metricsCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  metricsTitle: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '900',
    color: THEME.text,
  },
  metricRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    gap: 10,
  },
  metricLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.subtext,
  },
  metricValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '900',
  },
});

export default InvestmentCalculatorScreen;
