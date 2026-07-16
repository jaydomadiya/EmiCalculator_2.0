import { OtherCalculatorResult, OtherCalculatorTool } from '../types/otherCalculator';
import { InvestmentCurrency } from '../types/investment';
import { clampPositive, formatDuration, parseMoney, tenureMonths } from './investment';

const MAX_MONTHS = 1200;

export function getOtherCalculatorTitle(tool: OtherCalculatorTool): string {
  switch (tool) {
    case 'creditCardPayoff':
      return 'Credit Card Payoff';
    case 'creditCardMinPayment':
      return 'Credit Card Minimum Payment';
    case 'breakEvenSellPrice':
      return 'Break-even Sell Price';
    case 'compoundInterest':
      return 'Compound Interest';
    default:
      return 'Calculator';
  }
}

export function getOtherCalculatorIcon(tool: OtherCalculatorTool): string {
  switch (tool) {
    case 'creditCardPayoff':
      return 'credit-card-check-outline';
    case 'creditCardMinPayment':
      return 'credit-card-clock-outline';
    case 'breakEvenSellPrice':
      return 'tag-outline';
    case 'compoundInterest':
      return 'percent-outline';
    default:
      return 'calculator-variant-outline';
  }
}

function monthlyRate(annualRate: string): number {
  return Math.max(parseMoney(annualRate), 0) / 100 / 12;
}

function payoffMonthsForPayment(balance: number, monthlyInterestRate: number, payment: number) {
  if (balance <= 0 || payment <= 0) {
    return { months: 0, totalPayment: 0, totalInterest: 0, feasible: false };
  }

  if (monthlyInterestRate > 0 && payment <= balance * monthlyInterestRate) {
    return { months: MAX_MONTHS, totalPayment: payment * MAX_MONTHS, totalInterest: payment * MAX_MONTHS - balance, feasible: false };
  }

  let remaining = balance;
  let months = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  while (remaining > 0.005 && months < MAX_MONTHS) {
    const interest = remaining * monthlyInterestRate;
    const due = remaining + interest;
    const paid = Math.min(payment, due);
    remaining = due - paid;
    totalInterest += interest;
    totalPayment += paid;
    months += 1;
  }

  return { months, totalPayment, totalInterest, feasible: remaining <= 0.005 };
}

function paymentForMonths(balance: number, monthlyInterestRate: number, months: number): number {
  if (months <= 0) {
    return 0;
  }
  if (monthlyInterestRate <= 0) {
    return balance / months;
  }
  return (balance * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -months));
}

export function calculateCreditCardPayoff(params: {
  balance: string;
  annualRate: string;
  monthlyPayment: string;
  desiredMonths: string;
  currency: InvestmentCurrency;
}): OtherCalculatorResult {
  const balance = clampPositive(parseMoney(params.balance));
  const rate = monthlyRate(params.annualRate);
  const enteredPayment = clampPositive(parseMoney(params.monthlyPayment));
  const desiredMonths = Math.round(clampPositive(parseMoney(params.desiredMonths)));
  const monthlyPayment = enteredPayment > 0 ? enteredPayment : paymentForMonths(balance, rate, desiredMonths);
  const payoff = payoffMonthsForPayment(balance, rate, monthlyPayment);
  const totalInterest = Math.max(payoff.totalInterest, 0);

  return {
    tool: 'creditCardPayoff',
    title: 'Credit Card Payoff Result',
    currency: params.currency,
    heroLabel: payoff.feasible ? 'Debt-free in' : 'Payment too low',
    heroValue: payoff.feasible ? formatDuration(payoff.months) : 'Increase payment',
    subtitle: payoff.feasible
      ? `At this pace, total interest is calculated over ${payoff.months} months.`
      : 'Monthly payment does not cover interest enough to pay down the balance.',
    metrics: [
      { label: 'Monthly Payment', value: monthlyPayment, tone: 'primary' },
      { label: 'Total Payment', value: payoff.totalPayment, tone: 'neutral' },
      { label: 'Total Interest', value: totalInterest, tone: 'gold' },
      { label: 'Annual Rate', value: `${Math.max(parseMoney(params.annualRate), 0).toFixed(2)}%`, tone: 'neutral' },
    ],
  };
}

export function calculateCreditCardMinimumPayment(params: {
  balance: string;
  annualRate: string;
  percentMode: string;
  minimumAmount: string;
  currency: InvestmentCurrency;
}): OtherCalculatorResult {
  const startBalance = clampPositive(parseMoney(params.balance));
  const rate = monthlyRate(params.annualRate);
  const minAmount = clampPositive(parseMoney(params.minimumAmount));
  const mode = params.percentMode;
  const fixedPercent = Number(mode);

  let balance = startBalance;
  let months = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  while (balance > 0.005 && months < MAX_MONTHS) {
    const interest = balance * rate;
    const percentPayment = Number.isFinite(fixedPercent)
      ? balance * (fixedPercent / 100)
      : interest + balance * (mode === 'interestPlus2' ? 0.02 : 0.01);
    const payment = Math.min(balance + interest, Math.max(percentPayment, minAmount));
    balance = balance + interest - payment;
    totalInterest += interest;
    totalPayment += payment;
    months += 1;
  }

  return {
    tool: 'creditCardMinPayment',
    title: 'Minimum Payment Result',
    currency: params.currency,
    heroLabel: months < MAX_MONTHS ? 'Payoff time' : 'Long payoff',
    heroValue: months < MAX_MONTHS ? formatDuration(months) : '100+ Years',
    subtitle: 'Minimum-only payments can create a long repayment timeline.',
    metrics: [
      { label: 'Starting Balance', value: startBalance, tone: 'neutral' },
      { label: 'First Minimum Payment', value: Math.min(startBalance + startBalance * rate, Math.max(Number.isFinite(fixedPercent) ? startBalance * (fixedPercent / 100) : startBalance * 0.01 + startBalance * rate, minAmount)), tone: 'primary' },
      { label: 'Total Payment', value: totalPayment, tone: 'neutral' },
      { label: 'Total Interest', value: totalInterest, tone: 'gold' },
    ],
  };
}

export function calculateBreakEvenSellPrice(params: {
  buyPrice: string;
  commissionRate: string;
  taxRate: string;
  currency: InvestmentCurrency;
}): OtherCalculatorResult {
  const buyPrice = clampPositive(parseMoney(params.buyPrice));
  const commission = Math.max(parseMoney(params.commissionRate), 0) / 100;
  const tax = Math.max(parseMoney(params.taxRate), 0) / 100;
  const denominator = 1 - commission - tax;
  const sellPrice = denominator > 0 ? (buyPrice * (1 - tax)) / denominator : 0;
  const grossGain = Math.max(sellPrice - buyPrice, 0);
  const commissionCost = sellPrice * commission;
  const taxCost = grossGain * tax;

  return {
    tool: 'breakEvenSellPrice',
    title: 'Break-even Result',
    currency: params.currency,
    heroLabel: 'Break-even sell price',
    heroValue: sellPrice,
    subtitle: 'Sell at this price to cover commission and capital gains tax.',
    metrics: [
      { label: 'Buy Price', value: buyPrice, tone: 'neutral' },
      { label: 'Commission Cost', value: commissionCost, tone: 'gold' },
      { label: 'Tax Cost', value: taxCost, tone: 'gold' },
      { label: 'Required Gain', value: grossGain, tone: 'primary' },
    ],
  };
}

export function calculateCompoundInterest(params: {
  principal: string;
  annualRate: string;
  years: string;
  months: string;
  compoundsPerYear: string;
  currency: InvestmentCurrency;
}): OtherCalculatorResult {
  const principal = clampPositive(parseMoney(params.principal));
  const totalMonths = tenureMonths(params.years, params.months);
  const years = totalMonths / 12;
  const n = Math.max(Math.round(parseMoney(params.compoundsPerYear)), 1);
  const rate = Math.max(parseMoney(params.annualRate), 0) / 100;
  const futureValue = principal * Math.pow(1 + rate / n, n * years);
  const interest = Math.max(futureValue - principal, 0);

  return {
    tool: 'compoundInterest',
    title: 'Compound Interest Result',
    currency: params.currency,
    heroLabel: 'Future value',
    heroValue: futureValue,
    subtitle: `Compounded ${n}x per year for ${formatDuration(totalMonths)}.`,
    metrics: [
      { label: 'Initial Balance', value: principal, tone: 'neutral' },
      { label: 'Interest Earned', value: interest, tone: 'gold' },
      { label: 'Future Value', value: futureValue, tone: 'primary' },
      { label: 'Compounding', value: `${n}x / year`, tone: 'neutral' },
    ],
  };
}
