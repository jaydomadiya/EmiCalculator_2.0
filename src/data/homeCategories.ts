import { CATEGORY_PALETTE as PALETTE } from '../theme/colors';
import { ConverterTool } from '../types/converter';

export type CategoryTileItem = {
  labelKey: string;
  icon: string;
  color: string;
  loanTypeKey?: string;
  action?: ConverterTool;
};

export const CONVERTER_ITEMS: CategoryTileItem[] = [
  { labelKey: 'tiles.currencyConverter', icon: 'cash-multiple', color: PALETTE.sky, action: 'currencyConverter' },
  { labelKey: 'tiles.cryptoConverter', icon: 'bitcoin', color: PALETTE.amber, action: 'cryptoConverter' },
  { labelKey: 'tiles.customRate', icon: 'hand-coin-outline', color: PALETTE.teal, action: 'customRate' },
  { labelKey: 'tiles.currencyList', icon: 'format-list-bulleted-square', color: PALETTE.indigo, action: 'currencyList' },
];

export const EMI_CALCULATOR_ITEMS: CategoryTileItem[] = [
  { labelKey: 'tiles.personalLoan', icon: 'account-cash-outline', color: PALETTE.emerald, loanTypeKey: 'personalLoan' },
  { labelKey: 'tiles.mortgageLoan', icon: 'home-city-outline', color: PALETTE.indigo, loanTypeKey: 'mortgageLoan' },
  { labelKey: 'tiles.carLoan', icon: 'car-side', color: PALETTE.coral, loanTypeKey: 'carLoan' },
  { labelKey: 'tiles.businessLoan', icon: 'briefcase-variant-outline', color: PALETTE.plum, loanTypeKey: 'businessLoan' },
  { labelKey: 'tiles.goldLoan', icon: 'gold', color: PALETTE.gold, loanTypeKey: 'goldLoan' },
  { labelKey: 'tiles.studentLoan', icon: 'school-outline', color: PALETTE.sky, loanTypeKey: 'studentLoan' },
  { labelKey: 'tiles.cashLoan', icon: 'cash-fast', color: PALETTE.amber, loanTypeKey: 'cashLoan' },
  { labelKey: 'tiles.creditLoan', icon: 'credit-card-outline', color: PALETTE.rose, loanTypeKey: 'creditLoan' },
];

export const FINANCIAL_PLANNER_ITEMS: CategoryTileItem[] = [
  { labelKey: 'tiles.loanComparison', icon: 'scale-balance', color: PALETTE.violet, action: 'loanComparison' },
  { labelKey: 'tiles.loanAnalysis', icon: 'chart-line-variant', color: PALETTE.teal, action: 'loanAnalysis' },
  { labelKey: 'tiles.homeAffordability', icon: 'home-search-outline', color: PALETTE.indigo, action: 'homeAffordability' },
  { labelKey: 'tiles.savingsGoal', icon: 'piggy-bank-outline', color: PALETTE.rose, action: 'savingsGoal' },
];

export const INVESTMENT_ITEMS: CategoryTileItem[] = [
  { labelKey: 'tiles.fixedDeposit', icon: 'bank-outline', color: PALETTE.emerald, action: 'fixedDeposit' },
  { labelKey: 'tiles.recurringDeposit', icon: 'calendar-sync-outline', color: PALETTE.sky, action: 'recurringDeposit' },
  { labelKey: 'tiles.sipCalculator', icon: 'chart-donut', color: PALETTE.gold, action: 'sipCalculator' },
  { labelKey: 'tiles.returnOnInvestment', icon: 'trending-up', color: PALETTE.coral, action: 'returnOnInvestment' },
];

export const OTHER_CALCULATOR_ITEMS: CategoryTileItem[] = [
  { labelKey: 'tiles.creditCardPayoff', icon: 'credit-card-check-outline', color: PALETTE.emerald, action: 'creditCardPayoff' },
  { labelKey: 'tiles.creditCardMinPayment', icon: 'credit-card-clock-outline', color: PALETTE.rose, action: 'creditCardMinPayment' },
  { labelKey: 'tiles.breakEvenSellPrice', icon: 'tag-outline', color: PALETTE.amber, action: 'breakEvenSellPrice' },
  { labelKey: 'tiles.compoundInterest', icon: 'percent-outline', color: PALETTE.violet, action: 'compoundInterest' },
];
