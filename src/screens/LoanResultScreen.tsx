import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getLoanType } from '../data/loanTypes';
import { CalculationResult, LoanFormState } from '../types/loan';
import { formatCurrency, formatDate } from '../utils/emi';

const COLORS = {
  headerFrom: '#0B3D2E',
  headerTo: '#12594A',
  screenBg: '#FBFCFB',
  text: '#132420',
  subtext: '#5F6E68',
  border: '#ECEFEE',
  principal: '#1E8F5E',
  interest: '#D9822B',
  tax: '#4C5FD5',
  pmi: '#D5567C',
  hoa: '#9B4F8C',
};

type Props = {
  form: LoanFormState;
  result: CalculationResult;
  onBack: () => void;
  onDone: () => void;
};

function SummaryRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !isLast && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function SimpleResultBody({ form, data }: { form: LoanFormState; data: import('../utils/emi').EmiResult }) {
  const principalShare = data.totalPayment > 0 ? (data.principal / data.totalPayment) * 100 : 100;
  const interestShare = 100 - principalShare;

  if (form.variant !== 'simple') {
    return null;
  }

  const tenureLabel =
    form.tenureUnit === 'Years' ? `${form.tenureValue} Years` : `${form.tenureValue} Months`;

  return (
    <>
      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Monthly EMI</Text>
        <Text style={styles.resultValue}>{formatCurrency(data.emi)}</Text>

        <View style={styles.breakdownBar}>
          <View
            style={[styles.breakdownSegment, { flex: principalShare, backgroundColor: COLORS.principal }]}
          />
          <View
            style={[styles.breakdownSegment, { flex: interestShare, backgroundColor: COLORS.interest }]}
          />
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.principal }]} />
            <View>
              <Text style={styles.legendLabel}>Principal</Text>
              <Text style={styles.legendValue}>{formatCurrency(data.principal)}</Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.interest }]} />
            <View>
              <Text style={styles.legendLabel}>Total Interest</Text>
              <Text style={styles.legendValue}>{formatCurrency(data.totalInterest)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payment</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.totalPayment)}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Loan Summary</Text>
        <SummaryRow label="Loan Amount" value={formatCurrency(data.principal)} />
        <SummaryRow label="Interest Rate" value={`${form.rate}%/year`} />
        <SummaryRow label="Loan Tenure" value={tenureLabel} />
        <SummaryRow label="Number of EMIs" value={`${data.tenureMonths}`} />
        <SummaryRow label="Start Date" value={formatDate(form.startDate)} isLast />
      </View>
    </>
  );
}

function SimpleWithFeeResultBody({
  form,
  data,
}: {
  form: LoanFormState;
  data: import('../utils/emi').EmiWithFeeResult;
}) {
  const principalShare = data.totalPayment > 0 ? (data.principal / data.totalPayment) * 100 : 100;
  const interestShare = 100 - principalShare;

  if (form.variant !== 'simple') {
    return null;
  }

  const tenureLabel =
    form.tenureUnit === 'Years' ? `${form.tenureValue} Years` : `${form.tenureValue} Months`;

  return (
    <>
      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Monthly EMI</Text>
        <Text style={styles.resultValue}>{formatCurrency(data.emi)}</Text>

        <View style={styles.breakdownBar}>
          <View
            style={[styles.breakdownSegment, { flex: principalShare, backgroundColor: COLORS.principal }]}
          />
          <View
            style={[styles.breakdownSegment, { flex: interestShare, backgroundColor: COLORS.interest }]}
          />
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.principal }]} />
            <View>
              <Text style={styles.legendLabel}>Principal</Text>
              <Text style={styles.legendValue}>{formatCurrency(data.principal)}</Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.interest }]} />
            <View>
              <Text style={styles.legendLabel}>Total Interest</Text>
              <Text style={styles.legendValue}>{formatCurrency(data.totalInterest)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payment</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.totalPayment)}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Loan Summary</Text>
        <SummaryRow label="Sanctioned Amount" value={formatCurrency(data.principal)} />
        <SummaryRow label="Processing Fee" value={formatCurrency(data.processingFeeAmount)} />
        <SummaryRow label="Net Disbursed Amount" value={formatCurrency(data.netDisbursedAmount)} />
        <SummaryRow label="Interest Rate" value={`${form.rate}%/year`} />
        <SummaryRow label="Loan Tenure" value={tenureLabel} />
        <SummaryRow label="Total Cost (Interest + Fee)" value={formatCurrency(data.totalCost)} isLast />
      </View>
    </>
  );
}

function BulletResultBody({
  form,
  data,
}: {
  form: LoanFormState;
  data: import('../utils/emi').BulletResult;
}) {
  if (form.variant !== 'simple') {
    return null;
  }

  const tenureLabel =
    form.tenureUnit === 'Years' ? `${form.tenureValue} Years` : `${form.tenureValue} Months`;

  return (
    <>
      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Monthly Interest Payment</Text>
        <Text style={styles.resultValue}>{formatCurrency(data.monthlyInterest)}</Text>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Principal (due at maturity)</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.principal)}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Loan Summary</Text>
        <SummaryRow label="Loan Amount" value={formatCurrency(data.principal)} />
        <SummaryRow label="Interest Rate" value={`${form.rate}%/year`} />
        <SummaryRow label="Tenure" value={tenureLabel} />
        <SummaryRow label="Total Interest Payable" value={formatCurrency(data.totalInterest)} />
        <SummaryRow
          label="Total Repayment"
          value={formatCurrency(data.totalPayment)}
          isLast
        />
      </View>
    </>
  );
}

function MoratoriumResultBody({
  form,
  data,
}: {
  form: LoanFormState;
  data: import('../utils/emi').MoratoriumResult;
}) {
  if (form.variant !== 'simple') {
    return null;
  }

  const tenureLabel =
    form.tenureUnit === 'Years' ? `${form.tenureValue} Years` : `${form.tenureValue} Months`;

  return (
    <>
      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Monthly EMI (after moratorium)</Text>
        <Text style={styles.resultValue}>{formatCurrency(data.emi)}</Text>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payment</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.totalPayment)}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Loan Summary</Text>
        <SummaryRow label="Original Loan Amount" value={formatCurrency(data.originalPrincipal)} />
        <SummaryRow label="Moratorium Period" value={`${data.moratoriumMonths} Months`} />
        <SummaryRow label="Interest Accrued in Moratorium" value={formatCurrency(data.moratoriumInterest)} />
        <SummaryRow label="Principal After Moratorium" value={formatCurrency(data.capitalizedPrincipal)} />
        <SummaryRow label="Repayment Tenure" value={tenureLabel} />
        <SummaryRow label="Total Interest" value={formatCurrency(data.totalInterest)} isLast />
      </View>
    </>
  );
}

function MortgageResultBody({
  form,
  data,
}: {
  form: LoanFormState;
  data: import('../utils/emi').MortgageResult;
}) {
  if (form.variant !== 'mortgage') {
    return null;
  }

  const segments = [
    { key: 'pi', label: 'Principal & Interest', value: data.principalAndInterest, color: COLORS.principal },
    { key: 'tax', label: 'Property Tax', value: data.propertyTaxMonthly, color: COLORS.tax },
    { key: 'pmi', label: 'PMI', value: data.pmiMonthly, color: COLORS.pmi },
    { key: 'insurance', label: "Homeowner's Insurance", value: data.insuranceMonthly, color: COLORS.interest },
    { key: 'hoa', label: 'HOA Fee', value: data.hoaFeeMonthly, color: COLORS.hoa },
  ].filter(segment => segment.value > 0);

  const downPaymentPercent = form.variant === 'mortgage' ? form.downPaymentPercent : '';

  return (
    <>
      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Total Monthly Payment</Text>
        <Text style={styles.resultValue}>{formatCurrency(data.totalMonthly)}</Text>

        <View style={styles.breakdownBar}>
          {segments.map(segment => (
            <View
              key={segment.key}
              style={[
                styles.breakdownSegment,
                { flex: segment.value, backgroundColor: segment.color },
              ]}
            />
          ))}
        </View>

        {segments.map(segment => (
          <View key={segment.key} style={styles.mortgageLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
              <Text style={styles.legendLabel}>{segment.label}</Text>
            </View>
            <Text style={styles.legendValue}>{formatCurrency(segment.value)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Interest (loan term)</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.totalInterest)}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Loan Summary</Text>
        <SummaryRow
          label="Home Price"
          value={formatCurrency(Number(form.variant === 'mortgage' ? form.homePrice : 0))}
        />
        <SummaryRow
          label="Down Payment"
          value={`${formatCurrency(
            Number(form.variant === 'mortgage' ? form.downPaymentAmount : 0),
          )} (${downPaymentPercent}%)`}
        />
        <SummaryRow label="Loan Amount" value={formatCurrency(data.loanPrincipal)} />
        <SummaryRow label="Interest Rate" value={`${form.rate}%`} />
        <SummaryRow
          label="Loan Term"
          value={`${form.variant === 'mortgage' ? form.tenureYears : ''} Years`}
          isLast
        />
      </View>
    </>
  );
}

function LoanResultScreen({ form, result, onBack, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const loanType = getLoanType(form.loanTypeKey);

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
        <Text style={styles.headerTitle}>{t(loanType.labelKey)}</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {result.variant === 'simple' && <SimpleResultBody form={form} data={result.data} />}
        {result.variant === 'simpleWithFee' && (
          <SimpleWithFeeResultBody form={form} data={result.data} />
        )}
        {result.variant === 'bullet' && <BulletResultBody form={form} data={result.data} />}
        {result.variant === 'moratorium' && (
          <MoratoriumResultBody form={form} data={result.data} />
        )}
        {result.variant === 'mortgage' && (
          <MortgageResultBody form={form} data={result.data} />
        )}

        <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={onDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.adSlot, { paddingBottom: insets.bottom }]} />
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
    paddingBottom: 24,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  resultValue: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.headerFrom,
    marginTop: 4,
    marginBottom: 16,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  breakdownSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mortgageLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 13.5,
    color: COLORS.subtext,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  doneButton: {
    backgroundColor: COLORS.headerFrom,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  adSlot: {
    height: 60,
    backgroundColor: COLORS.screenBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default LoanResultScreen;
