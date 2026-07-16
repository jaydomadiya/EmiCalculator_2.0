import { useState } from 'react';
import {
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LOAN_TYPES, LoanType, getLoanType } from '../data/loanTypes';
import {
  LoanFormPatch,
  LoanFormState,
  MortgageLoanFormState,
  SimpleLoanFormState,
  TenureUnit,
} from '../types/loan';
import { formatDate } from '../utils/emi';
import { THEME, hexToRgba } from '../theme/colors';

const COLORS = {
  headerFrom: THEME.headerFrom,
  headerTo: THEME.headerTo,
  screenBg: THEME.screenBg,
  text: THEME.text,
  subtext: THEME.subtext,
  fieldBorder: THEME.border,
  fieldBg: THEME.cardBg,
};

function formatAmountInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) {
    return '';
  }
  return Number(digits).toLocaleString('en-IN');
}

const TENURE_UNITS: TenureUnit[] = ['Months', 'Years'];

type Props = {
  form: LoanFormState;
  onChangeForm: (patch: LoanFormPatch) => void;
  onSelectLoanType: (loanTypeKey: string) => void;
  onBack: () => void;
  onReset: () => void;
  onNext: () => void;
};

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function AmountField({
  value,
  onChangeText,
  suffix,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldBox}>
      <TextInput
        style={styles.fieldInput}
        value={formatAmountInput(value)}
        onChangeText={text => onChangeText(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder={placeholder ?? '0'}
        placeholderTextColor={COLORS.subtext}
      />
      {suffix && <Text style={styles.fieldSuffix}>{suffix}</Text>}
    </View>
  );
}

function SimpleFields({
  form,
  loanType,
  onChangeForm,
}: {
  form: SimpleLoanFormState;
  loanType: LoanType;
  onChangeForm: (patch: LoanFormPatch) => void;
}) {
  const [tenureUnitModalVisible, setTenureUnitModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  return (
    <>
      <FieldLabel>Loan Amount</FieldLabel>
      <AmountField
        value={form.amount}
        onChangeText={amount => onChangeForm({ amount })}
      />

      {loanType.supportsBulletRepayment && (
        <>
          <FieldLabel>Repayment Type</FieldLabel>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                form.repaymentType === 'bullet' && styles.segmentButtonActive,
              ]}
              activeOpacity={0.8}
              onPress={() => onChangeForm({ repaymentType: 'bullet' })}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  form.repaymentType === 'bullet' && styles.segmentButtonTextActive,
                ]}
              >
                Interest Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                form.repaymentType === 'emi' && styles.segmentButtonActive,
              ]}
              activeOpacity={0.8}
              onPress={() => onChangeForm({ repaymentType: 'emi' })}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  form.repaymentType === 'emi' && styles.segmentButtonTextActive,
                ]}
              >
                EMI
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            {form.repaymentType === 'bullet'
              ? 'Pay only interest every month; the full principal is repaid at the end of the tenure.'
              : 'Pay a fixed EMI covering both principal and interest each month.'}
          </Text>
        </>
      )}

      <FieldLabel>Expected Interest Rate</FieldLabel>
      <View style={styles.fieldBox}>
        <TextInput
          style={styles.fieldInput}
          value={form.rate}
          onChangeText={text =>
            onChangeForm({ rate: text.replace(/[^0-9.]/g, '') })
          }
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={COLORS.subtext}
        />
        <Text style={styles.fieldSuffix}>%/year</Text>
      </View>

      {loanType.supportsProcessingFee && (
        <>
          <FieldLabel>Processing Fee</FieldLabel>
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              value={form.processingFeePercent ?? ''}
              onChangeText={text =>
                onChangeForm({ processingFeePercent: text.replace(/[^0-9.]/g, '') })
              }
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.subtext}
            />
            <Text style={styles.fieldSuffix}>%</Text>
          </View>
        </>
      )}

      <FieldLabel>Loan Tenure</FieldLabel>
      <View style={styles.fieldBox}>
        <TextInput
          style={styles.fieldInput}
          value={form.tenureValue}
          onChangeText={text =>
            onChangeForm({ tenureValue: text.replace(/[^0-9]/g, '') })
          }
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.subtext}
        />
        <TouchableOpacity
          style={styles.tenureUnitButton}
          activeOpacity={0.75}
          onPress={() => setTenureUnitModalVisible(true)}
        >
          <Text style={styles.tenureUnitText}>{form.tenureUnit}</Text>
          <Icon name="chevron-down" size={18} color={COLORS.subtext} />
        </TouchableOpacity>
      </View>

      {loanType.supportsMoratorium && (
        <>
          <FieldLabel>Moratorium Period</FieldLabel>
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              value={form.moratoriumMonths ?? ''}
              onChangeText={text =>
                onChangeForm({ moratoriumMonths: text.replace(/[^0-9]/g, '') })
              }
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.subtext}
            />
            <Text style={styles.fieldSuffix}>Months</Text>
          </View>
          <Text style={styles.helperText}>
            No payments during this period after disbursement — interest accrues and is added
            to the principal before EMIs begin.
          </Text>
        </>
      )}

      <FieldLabel>Start Date</FieldLabel>
      <TouchableOpacity
        style={styles.fieldBox}
        activeOpacity={0.75}
        onPress={() => setDatePickerVisible(true)}
      >
        <Text style={styles.fieldValueText}>{formatDate(form.startDate)}</Text>
        <Icon name="calendar-month-outline" size={20} color={COLORS.headerFrom} />
      </TouchableOpacity>

      {datePickerVisible && (
        <DateTimePicker
          value={form.startDate}
          mode="date"
          display="default"
          onChange={(_event, selectedDate) => {
            setDatePickerVisible(false);
            if (selectedDate) {
              onChangeForm({ startDate: selectedDate });
            }
          }}
        />
      )}

      <Modal
        visible={tenureUnitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTenureUnitModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTenureUnitModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Tenure Unit</Text>
            {TENURE_UNITS.map(unit => (
              <TouchableOpacity
                key={unit}
                style={styles.modalRow}
                activeOpacity={0.7}
                onPress={() => {
                  onChangeForm({ tenureUnit: unit });
                  setTenureUnitModalVisible(false);
                }}
              >
                <Text style={styles.modalRowText}>{unit}</Text>
                {unit === form.tenureUnit && (
                  <Icon name="check" size={20} color={COLORS.headerFrom} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function MortgageFields({
  form,
  onChangeForm,
}: {
  form: MortgageLoanFormState;
  onChangeForm: (patch: LoanFormPatch) => void;
}) {
  const handleChangeHomePrice = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    const homePrice = Number(digits) || 0;
    const percent = Number(form.downPaymentPercent) || 0;
    const downPaymentAmount = Math.round((homePrice * percent) / 100).toString();
    onChangeForm({ homePrice: digits, downPaymentAmount });
  };

  const handleChangeDownPaymentAmount = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    const amount = Number(digits) || 0;
    const homePrice = Number(form.homePrice) || 0;
    const percent = homePrice > 0 ? ((amount / homePrice) * 100).toFixed(1) : form.downPaymentPercent;
    onChangeForm({ downPaymentAmount: digits, downPaymentPercent: percent });
  };

  const handleChangeDownPaymentPercent = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const percent = Number(cleaned) || 0;
    const homePrice = Number(form.homePrice) || 0;
    const downPaymentAmount = Math.round((homePrice * percent) / 100).toString();
    onChangeForm({ downPaymentPercent: cleaned, downPaymentAmount });
  };

  return (
    <>
      <FieldLabel>Home Price</FieldLabel>
      <AmountField value={form.homePrice} onChangeText={handleChangeHomePrice} />

      <FieldLabel>Down Payment</FieldLabel>
      <View style={styles.rowFields}>
        <View style={[styles.fieldBox, styles.rowFieldBox]}>
          <TextInput
            style={styles.fieldInput}
            value={formatAmountInput(form.downPaymentAmount)}
            onChangeText={handleChangeDownPaymentAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.subtext}
          />
          <Text style={styles.fieldSuffix}>₹</Text>
        </View>
        <View style={[styles.fieldBox, styles.rowFieldBox]}>
          <TextInput
            style={styles.fieldInput}
            value={form.downPaymentPercent}
            onChangeText={handleChangeDownPaymentPercent}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.subtext}
          />
          <Text style={styles.fieldSuffix}>%</Text>
        </View>
      </View>

      <FieldLabel>Loan Tenure</FieldLabel>
      <View style={styles.fieldBox}>
        <TextInput
          style={styles.fieldInput}
          value={form.tenureYears}
          onChangeText={text =>
            onChangeForm({ tenureYears: text.replace(/[^0-9]/g, '') })
          }
          keyboardType="numeric"
          placeholder="Loan tenure"
          placeholderTextColor={COLORS.subtext}
        />
        <Text style={styles.fieldSuffix}>Years</Text>
      </View>

      <FieldLabel>Interest Rate</FieldLabel>
      <View style={styles.fieldBox}>
        <TextInput
          style={styles.fieldInput}
          value={form.rate}
          onChangeText={text =>
            onChangeForm({ rate: text.replace(/[^0-9.]/g, '') })
          }
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={COLORS.subtext}
        />
        <Text style={styles.fieldSuffix}>%</Text>
      </View>

      <FieldLabel>Property Tax</FieldLabel>
      <AmountField
        value={form.propertyTax}
        onChangeText={propertyTax => onChangeForm({ propertyTax })}
        suffix="₹"
      />

      <FieldLabel>PMI</FieldLabel>
      <AmountField
        value={form.pmi}
        onChangeText={pmi => onChangeForm({ pmi })}
        suffix="₹"
      />

      <FieldLabel>Homeowner's Insurance</FieldLabel>
      <AmountField
        value={form.homeownersInsurance}
        onChangeText={homeownersInsurance => onChangeForm({ homeownersInsurance })}
        suffix="₹"
      />

      <FieldLabel>HOA Fee</FieldLabel>
      <AmountField
        value={form.hoaFee}
        onChangeText={hoaFee => onChangeForm({ hoaFee })}
        suffix="₹"
      />
    </>
  );
}

function LoanCalculatorScreen({
  form,
  onChangeForm,
  onSelectLoanType,
  onBack,
  onReset,
  onNext,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loanTypeModalVisible, setLoanTypeModalVisible] = useState(false);

  const selectedLoanType = getLoanType(form.loanTypeKey);

  const isNextEnabled =
    form.variant === 'simple'
      ? Number(form.amount) > 0 && Number(form.rate) > 0 && Number(form.tenureValue) > 0
      : Number(form.homePrice) > 0 && Number(form.rate) > 0 && Number(form.tenureYears) > 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Icon
          name="trending-up"
          size={140}
          color="rgba(255,255,255,0.08)"
          style={styles.headerWatermark}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('sections.emiCalculator')}</Text>
          <TouchableOpacity onPress={onReset} activeOpacity={0.8} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <FieldLabel>Loan Type</FieldLabel>
          <TouchableOpacity
            style={styles.fieldBox}
            activeOpacity={0.75}
            onPress={() => setLoanTypeModalVisible(true)}
          >
            <View
              style={[
                styles.loanTypeIcon,
                { backgroundColor: hexToRgba(selectedLoanType.color, 0.14) },
              ]}
            >
              <Icon name={selectedLoanType.icon as never} size={20} color={selectedLoanType.color} />
            </View>
            <Text style={styles.fieldValueText}>{t(selectedLoanType.labelKey)}</Text>
            <Icon name="chevron-down" size={20} color={COLORS.subtext} />
          </TouchableOpacity>

          {form.variant === 'simple' ? (
            <SimpleFields form={form} loanType={selectedLoanType} onChangeForm={onChangeForm} />
          ) : (
            <MortgageFields form={form} onChangeForm={onChangeForm} />
          )}

          <TouchableOpacity
            style={[styles.nextButton, !isNextEnabled && styles.nextButtonDisabled]}
            activeOpacity={0.85}
            disabled={!isNextEnabled}
            onPress={onNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={loanTypeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLoanTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLoanTypeModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Loan Type</Text>
            {LOAN_TYPES.map(loanType => (
              <TouchableOpacity
                key={loanType.key}
                style={styles.modalRow}
                activeOpacity={0.7}
                onPress={() => {
                  onSelectLoanType(loanType.key);
                  setLoanTypeModalVisible(false);
                }}
              >
                <View
                  style={[
                    styles.loanTypeIcon,
                    { backgroundColor: hexToRgba(loanType.color, 0.14) },
                  ]}
                >
                  <Icon name={loanType.icon as never} size={20} color={loanType.color} />
                </View>
                <Text style={styles.modalRowText}>{t(loanType.labelKey)}</Text>
                {loanType.key === form.loanTypeKey && (
                  <Icon name="check" size={20} color={COLORS.headerFrom} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  resetButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.fieldBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: COLORS.fieldBg,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  rowFieldBox: {
    flex: 1,
  },
  loanTypeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldValueText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    padding: 0,
  },
  fieldSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  tenureUnitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.fieldBorder,
  },
  tenureUnitText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  segmentRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.fieldBorder,
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.headerFrom,
  },
  segmentButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.subtext,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.subtext,
    lineHeight: 17,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: COLORS.headerFrom,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default LoanCalculatorScreen;
