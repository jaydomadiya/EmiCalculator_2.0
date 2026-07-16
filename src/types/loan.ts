import {
  BulletResult,
  EmiResult,
  EmiWithFeeResult,
  MoratoriumResult,
  MortgageResult,
} from '../utils/emi';

export type TenureUnit = 'Months' | 'Years';
export type RepaymentType = 'emi' | 'bullet';

export type SimpleLoanFormState = {
  variant: 'simple';
  loanTypeKey: string;
  amount: string;
  rate: string;
  tenureValue: string;
  tenureUnit: TenureUnit;
  startDate: Date;
  processingFeePercent?: string;
  repaymentType?: RepaymentType;
  moratoriumMonths?: string;
};

export type MortgageLoanFormState = {
  variant: 'mortgage';
  loanTypeKey: string;
  homePrice: string;
  downPaymentAmount: string;
  downPaymentPercent: string;
  tenureYears: string;
  rate: string;
  propertyTax: string;
  pmi: string;
  homeownersInsurance: string;
  hoaFee: string;
};

export type LoanFormState = SimpleLoanFormState | MortgageLoanFormState;

export type LoanFormPatch = {
  loanTypeKey?: string;
  amount?: string;
  rate?: string;
  tenureValue?: string;
  tenureUnit?: TenureUnit;
  startDate?: Date;
  processingFeePercent?: string;
  repaymentType?: RepaymentType;
  moratoriumMonths?: string;
  homePrice?: string;
  downPaymentAmount?: string;
  downPaymentPercent?: string;
  tenureYears?: string;
  propertyTax?: string;
  pmi?: string;
  homeownersInsurance?: string;
  hoaFee?: string;
};

export type CalculationResult =
  | { variant: 'simple'; data: EmiResult }
  | { variant: 'simpleWithFee'; data: EmiWithFeeResult }
  | { variant: 'bullet'; data: BulletResult }
  | { variant: 'moratorium'; data: MoratoriumResult }
  | { variant: 'mortgage'; data: MortgageResult };
