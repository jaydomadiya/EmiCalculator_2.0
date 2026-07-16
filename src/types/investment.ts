export type InvestmentTool = 'fixedDeposit' | 'recurringDeposit' | 'sipCalculator' | 'returnOnInvestment';

export type InvestmentCurrency = {
  code: string;
  country: string;
  name: string;
  symbol: string;
  flag: string;
};

export type InvestmentResultMetric = {
  label: string;
  value: number | string;
  tone?: 'primary' | 'gold' | 'neutral';
};

export type InvestmentResult = {
  tool: InvestmentTool;
  title: string;
  currency: InvestmentCurrency;
  investedAmount: number;
  maturityValue: number;
  gainAmount: number;
  rateLabel: string;
  durationLabel: string;
  metrics: InvestmentResultMetric[];
};
