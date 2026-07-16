import { EmiResult } from '../utils/emi';

export type LoanComparisonOptionInput = {
  label: string;
  years: string;
  rate: string;
};

export type LoanComparisonResult = {
  principal: number;
  optionA: LoanComparisonOptionInput;
  optionB: LoanComparisonOptionInput;
  resultA: EmiResult;
  resultB: EmiResult;
  winner: 'a' | 'b';
  savings: number;
  savingsPercent: number;
};
