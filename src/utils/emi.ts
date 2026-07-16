export type EmiResult = {
  emi: number;
  principal: number;
  totalInterest: number;
  totalPayment: number;
  tenureMonths: number;
};

export function tenureToMonths(value: number, unit: 'Months' | 'Years'): number {
  return unit === 'Years' ? Math.round(value * 12) : Math.round(value);
}

export function calculateEmi(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
): EmiResult {
  if (principal <= 0 || tenureMonths <= 0) {
    return { emi: 0, principal, totalInterest: 0, totalPayment: 0, tenureMonths };
  }

  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    return {
      emi,
      principal,
      totalInterest: 0,
      totalPayment: principal,
      tenureMonths,
    };
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return { emi, principal, totalInterest, totalPayment, tenureMonths };
}

export type MortgageResult = {
  loanPrincipal: number;
  principalAndInterest: number;
  propertyTaxMonthly: number;
  pmiMonthly: number;
  insuranceMonthly: number;
  hoaFeeMonthly: number;
  totalMonthly: number;
  totalInterest: number;
  totalPayment: number;
  tenureMonths: number;
};

export function calculateMortgagePayment(
  homePrice: number,
  downPayment: number,
  annualRatePercent: number,
  tenureYears: number,
  propertyTaxAnnual: number,
  pmiMonthly: number,
  homeownersInsuranceAnnual: number,
  hoaFeeMonthly: number,
): MortgageResult {
  const loanPrincipal = Math.max(homePrice - downPayment, 0);
  const tenureMonths = Math.round(tenureYears * 12);
  const { emi, totalInterest, totalPayment } = calculateEmi(
    loanPrincipal,
    annualRatePercent,
    tenureMonths,
  );
  const propertyTaxMonthly = propertyTaxAnnual / 12;
  const insuranceMonthly = homeownersInsuranceAnnual / 12;
  const totalMonthly =
    emi + propertyTaxMonthly + pmiMonthly + insuranceMonthly + hoaFeeMonthly;

  return {
    loanPrincipal,
    principalAndInterest: emi,
    propertyTaxMonthly,
    pmiMonthly,
    insuranceMonthly,
    hoaFeeMonthly,
    totalMonthly,
    totalInterest,
    totalPayment,
    tenureMonths,
  };
}

export type EmiWithFeeResult = EmiResult & {
  processingFeeAmount: number;
  netDisbursedAmount: number;
  totalCost: number;
};

export function calculateEmiWithProcessingFee(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
  processingFeePercent: number,
): EmiWithFeeResult {
  const emiResult = calculateEmi(principal, annualRatePercent, tenureMonths);
  const processingFeeAmount = principal * (processingFeePercent / 100);
  const netDisbursedAmount = principal - processingFeeAmount;
  const totalCost = emiResult.totalInterest + processingFeeAmount;

  return { ...emiResult, processingFeeAmount, netDisbursedAmount, totalCost };
}

export type BulletResult = {
  principal: number;
  monthlyInterest: number;
  totalInterest: number;
  totalPayment: number;
  tenureMonths: number;
};

export function calculateBulletRepayment(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
): BulletResult {
  if (principal <= 0 || tenureMonths <= 0) {
    return { principal, monthlyInterest: 0, totalInterest: 0, totalPayment: principal, tenureMonths };
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const monthlyInterest = principal * monthlyRate;
  const totalInterest = monthlyInterest * tenureMonths;
  const totalPayment = principal + totalInterest;

  return { principal, monthlyInterest, totalInterest, totalPayment, tenureMonths };
}

export type MoratoriumResult = {
  originalPrincipal: number;
  moratoriumInterest: number;
  capitalizedPrincipal: number;
  emi: number;
  moratoriumMonths: number;
  repaymentMonths: number;
  totalInterest: number;
  totalPayment: number;
};

export function calculateEmiWithMoratorium(
  principal: number,
  annualRatePercent: number,
  moratoriumMonths: number,
  repaymentMonths: number,
): MoratoriumResult {
  const monthlyRate = annualRatePercent / 12 / 100;
  const moratoriumInterest =
    principal * (Math.pow(1 + monthlyRate, moratoriumMonths) - 1);
  const capitalizedPrincipal = principal + moratoriumInterest;
  const emiResult = calculateEmi(capitalizedPrincipal, annualRatePercent, repaymentMonths);

  return {
    originalPrincipal: principal,
    moratoriumInterest,
    capitalizedPrincipal,
    emi: emiResult.emi,
    moratoriumMonths,
    repaymentMonths,
    totalInterest: emiResult.totalPayment - principal,
    totalPayment: emiResult.totalPayment,
  };
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatCurrency(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN');
}
