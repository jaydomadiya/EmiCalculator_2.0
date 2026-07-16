import { InvestmentCurrency } from './investment';

export type OtherCalculatorTool =
  | 'creditCardPayoff'
  | 'creditCardMinPayment'
  | 'breakEvenSellPrice'
  | 'compoundInterest';

export type OtherCalculatorMetric = {
  label: string;
  value: number | string;
  tone?: 'primary' | 'gold' | 'neutral' | 'danger';
};

export type OtherCalculatorResult = {
  tool: OtherCalculatorTool;
  title: string;
  currency: InvestmentCurrency;
  heroLabel: string;
  heroValue: number | string;
  subtitle: string;
  metrics: OtherCalculatorMetric[];
};
