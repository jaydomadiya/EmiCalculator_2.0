import { InvestmentCurrency, InvestmentResult, InvestmentTool } from '../types/investment';

export const INVESTMENT_CURRENCIES: InvestmentCurrency[] = [
  { code: 'INR', country: 'India', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', country: 'United States', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', country: 'United Kingdom', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AUD', country: 'Australia', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', country: 'Canada', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'NZD', country: 'New Zealand', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'EUR', country: 'Europe', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'JPY', country: 'Japan', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'SGD', country: 'Singapore', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'AED', country: 'United Arab Emirates', name: 'Emirati Dirham', symbol: 'د.إ', flag: '🇦🇪' },
];

export function parseMoney(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clampPositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function tenureMonths(years: string, months: string): number {
  return Math.max(0, Math.round(parseMoney(years) * 12 + parseMoney(months)));
}

export function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) {
    return `${years} Years ${months} Months`;
  }
  if (years > 0) {
    return `${years} Years`;
  }
  return `${months} Months`;
}

export function formatInvestmentAmount(value: number, currency: InvestmentCurrency): string {
  if (!Number.isFinite(value)) {
    return `${currency.symbol}0.00`;
  }
  const sign = value < 0 ? '-' : '';
  return `${sign}${currency.symbol}${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeRate(rate: string): number {
  return Math.max(parseMoney(rate), 0);
}

export function calculateFixedDeposit(params: {
  principal: string;
  annualRate: string;
  years: string;
  months: string;
  compoundsPerYear: number;
  currency: InvestmentCurrency;
}): InvestmentResult {
  const principal = clampPositive(parseMoney(params.principal));
  const months = tenureMonths(params.years, params.months);
  const years = months / 12;
  const rate = safeRate(params.annualRate) / 100;
  const n = Math.max(params.compoundsPerYear, 1);
  const maturityValue = principal * Math.pow(1 + rate / n, n * years);
  const interest = Math.max(maturityValue - principal, 0);

  return {
    tool: 'fixedDeposit',
    title: 'Fixed Deposit Result',
    currency: params.currency,
    investedAmount: principal,
    maturityValue,
    gainAmount: interest,
    rateLabel: `${safeRate(params.annualRate).toFixed(2)}% p.a.`,
    durationLabel: formatDuration(months),
    metrics: [
      { label: 'Investment Amount', value: principal, tone: 'neutral' },
      { label: 'Interest Earned', value: interest, tone: 'gold' },
      { label: 'Maturity Value', value: maturityValue, tone: 'primary' },
      { label: 'Compounding', value: `${n}x / year`, tone: 'neutral' },
    ],
  };
}

export function calculateRecurringDeposit(params: {
  monthlyInvestment: string;
  annualRate: string;
  years: string;
  months: string;
  currency: InvestmentCurrency;
}): InvestmentResult {
  const monthlyInvestment = clampPositive(parseMoney(params.monthlyInvestment));
  const totalMonths = tenureMonths(params.years, params.months);
  const monthlyRate = safeRate(params.annualRate) / 100 / 12;
  const invested = monthlyInvestment * totalMonths;
  const maturityValue =
    monthlyRate > 0
      ? monthlyInvestment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
      : invested;
  const interest = Math.max(maturityValue - invested, 0);

  return {
    tool: 'recurringDeposit',
    title: 'Recurring Deposit Result',
    currency: params.currency,
    investedAmount: invested,
    maturityValue,
    gainAmount: interest,
    rateLabel: `${safeRate(params.annualRate).toFixed(2)}% p.a.`,
    durationLabel: formatDuration(totalMonths),
    metrics: [
      { label: 'Monthly Deposit', value: monthlyInvestment, tone: 'neutral' },
      { label: 'Total Investment', value: invested, tone: 'neutral' },
      { label: 'Interest Earned', value: interest, tone: 'gold' },
      { label: 'Maturity Value', value: maturityValue, tone: 'primary' },
    ],
  };
}

export function calculateSip(params: {
  monthlySip: string;
  annualRate: string;
  years: string;
  months: string;
  currency: InvestmentCurrency;
}): InvestmentResult {
  const monthlySip = clampPositive(parseMoney(params.monthlySip));
  const totalMonths = tenureMonths(params.years, params.months);
  const monthlyRate = safeRate(params.annualRate) / 100 / 12;
  const invested = monthlySip * totalMonths;
  const maturityValue =
    monthlyRate > 0
      ? monthlySip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
      : invested;
  const wealthGain = Math.max(maturityValue - invested, 0);

  return {
    tool: 'sipCalculator',
    title: 'SIP Result',
    currency: params.currency,
    investedAmount: invested,
    maturityValue,
    gainAmount: wealthGain,
    rateLabel: `${safeRate(params.annualRate).toFixed(2)}% p.a.`,
    durationLabel: formatDuration(totalMonths),
    metrics: [
      { label: 'Monthly SIP', value: monthlySip, tone: 'neutral' },
      { label: 'Invested Amount', value: invested, tone: 'neutral' },
      { label: 'Wealth Gain', value: wealthGain, tone: 'gold' },
      { label: 'Expected Value', value: maturityValue, tone: 'primary' },
    ],
  };
}

export function calculateRoi(params: {
  originalInvestment: string;
  endingInvestment: string;
  years: string;
  months: string;
  currency: InvestmentCurrency;
}): InvestmentResult {
  const original = clampPositive(parseMoney(params.originalInvestment));
  const ending = clampPositive(parseMoney(params.endingInvestment));
  const totalMonths = tenureMonths(params.years, params.months);
  const gain = ending - original;
  const roiPercent = original > 0 ? (gain / original) * 100 : 0;
  const annualized =
    original > 0 && ending > 0 && totalMonths > 0
      ? (Math.pow(ending / original, 12 / totalMonths) - 1) * 100
      : 0;

  return {
    tool: 'returnOnInvestment',
    title: 'ROI Result',
    currency: params.currency,
    investedAmount: original,
    maturityValue: ending,
    gainAmount: gain,
    rateLabel: `${roiPercent.toFixed(2)}% ROI`,
    durationLabel: formatDuration(totalMonths),
    metrics: [
      { label: 'Original Investment', value: original, tone: 'neutral' },
      { label: 'Ending Investment', value: ending, tone: 'primary' },
      { label: 'Net Gain', value: gain, tone: gain >= 0 ? 'gold' : 'neutral' },
      { label: 'Annualized Return', value: `${annualized.toFixed(2)}%`, tone: 'primary' },
    ],
  };
}

export function getInvestmentTitle(tool: InvestmentTool): string {
  switch (tool) {
    case 'fixedDeposit':
      return 'Fixed Deposit';
    case 'recurringDeposit':
      return 'Recurring Deposit';
    case 'sipCalculator':
      return 'SIP Calculator';
    case 'returnOnInvestment':
      return 'Return On Investment';
    default:
      return 'Investment Calculator';
  }
}
