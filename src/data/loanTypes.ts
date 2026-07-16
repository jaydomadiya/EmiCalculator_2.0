import { CATEGORY_PALETTE } from '../theme/colors';

export type LoanType = {
  key: string;
  labelKey: string;
  icon: string;
  color: string;
  variant: 'simple' | 'mortgage';
  defaultAmount: number;
  defaultRate: number;
  defaultTenureValue: number;
  defaultTenureUnit: 'Months' | 'Years';
  defaultHomePrice?: number;
  defaultDownPaymentPercent?: number;
  defaultPropertyTax?: number;
  defaultPmi?: number;
  defaultHomeownersInsurance?: number;
  defaultHoaFee?: number;
  supportsProcessingFee?: boolean;
  defaultProcessingFeePercent?: number;
  supportsBulletRepayment?: boolean;
  defaultRepaymentType?: 'emi' | 'bullet';
  supportsMoratorium?: boolean;
  defaultMoratoriumMonths?: number;
};

const PALETTE = CATEGORY_PALETTE;

export const LOAN_TYPES: LoanType[] = [
  {
    key: 'personalLoan',
    labelKey: 'tiles.personalLoan',
    icon: 'account-cash-outline',
    color: PALETTE.emerald,
    variant: 'simple',
    defaultAmount: 15000,
    defaultRate: 1.5,
    defaultTenureValue: 6,
    defaultTenureUnit: 'Months',
  },
  {
    key: 'mortgageLoan',
    labelKey: 'tiles.mortgageLoan',
    icon: 'home-city-outline',
    color: PALETTE.indigo,
    variant: 'mortgage',
    defaultAmount: 2500000,
    defaultRate: 8.5,
    defaultTenureValue: 20,
    defaultTenureUnit: 'Years',
    defaultHomePrice: 2500000,
    defaultDownPaymentPercent: 20,
    defaultPropertyTax: 12000,
    defaultPmi: 0,
    defaultHomeownersInsurance: 6000,
    defaultHoaFee: 0,
  },
  {
    key: 'carLoan',
    labelKey: 'tiles.carLoan',
    icon: 'car-side',
    color: PALETTE.coral,
    variant: 'simple',
    defaultAmount: 800000,
    defaultRate: 9,
    defaultTenureValue: 5,
    defaultTenureUnit: 'Years',
  },
  {
    key: 'businessLoan',
    labelKey: 'tiles.businessLoan',
    icon: 'briefcase-variant-outline',
    color: PALETTE.plum,
    variant: 'simple',
    defaultAmount: 500000,
    defaultRate: 11,
    defaultTenureValue: 3,
    defaultTenureUnit: 'Years',
    supportsProcessingFee: true,
    defaultProcessingFeePercent: 2,
  },
  {
    key: 'goldLoan',
    labelKey: 'tiles.goldLoan',
    icon: 'gold',
    color: PALETTE.gold,
    variant: 'simple',
    defaultAmount: 200000,
    defaultRate: 7.5,
    defaultTenureValue: 12,
    defaultTenureUnit: 'Months',
    supportsBulletRepayment: true,
    defaultRepaymentType: 'bullet',
  },
  {
    key: 'studentLoan',
    labelKey: 'tiles.studentLoan',
    icon: 'school-outline',
    color: PALETTE.sky,
    variant: 'simple',
    defaultAmount: 1000000,
    defaultRate: 8,
    defaultTenureValue: 10,
    defaultTenureUnit: 'Years',
    supportsMoratorium: true,
    defaultMoratoriumMonths: 12,
  },
  {
    key: 'cashLoan',
    labelKey: 'tiles.cashLoan',
    icon: 'cash-fast',
    color: PALETTE.amber,
    variant: 'simple',
    defaultAmount: 50000,
    defaultRate: 13,
    defaultTenureValue: 12,
    defaultTenureUnit: 'Months',
  },
  {
    key: 'creditLoan',
    labelKey: 'tiles.creditLoan',
    icon: 'credit-card-outline',
    color: PALETTE.rose,
    variant: 'simple',
    defaultAmount: 100000,
    defaultRate: 14,
    defaultTenureValue: 24,
    defaultTenureUnit: 'Months',
  },
];

export function getLoanType(key: string): LoanType {
  return LOAN_TYPES.find(loanType => loanType.key === key) ?? LOAN_TYPES[0];
}
