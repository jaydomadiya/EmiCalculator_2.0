export type CurrencyKind = 'fiat' | 'crypto';

export type CurrencySelection = {
  code: string;
  kind: CurrencyKind;
};

export function sameSelection(a: CurrencySelection, b: CurrencySelection): boolean {
  return a.code === b.code && a.kind === b.kind;
}

function toUsd(
  amount: number,
  selection: CurrencySelection,
  fiatRatesUsd: Record<string, number> | null,
  cryptoPricesUsdt: Record<string, number> | null,
): number | null {
  if (selection.kind === 'fiat') {
    const rate = fiatRatesUsd?.[selection.code];
    return rate ? amount / rate : null;
  }
  const price = cryptoPricesUsdt?.[selection.code];
  return price ? amount * price : null;
}

function fromUsd(
  usdAmount: number,
  selection: CurrencySelection,
  fiatRatesUsd: Record<string, number> | null,
  cryptoPricesUsdt: Record<string, number> | null,
): number | null {
  if (selection.kind === 'fiat') {
    const rate = fiatRatesUsd?.[selection.code];
    return rate ? usdAmount * rate : null;
  }
  const price = cryptoPricesUsdt?.[selection.code];
  return price ? usdAmount / price : null;
}

export function convertBetween(
  amount: number,
  from: CurrencySelection,
  to: CurrencySelection,
  fiatRatesUsd: Record<string, number> | null,
  cryptoPricesUsdt: Record<string, number> | null,
): number | null {
  if (Number.isNaN(amount)) {
    return null;
  }
  const usdAmount = toUsd(amount, from, fiatRatesUsd, cryptoPricesUsdt);
  if (usdAmount === null) {
    return null;
  }
  return fromUsd(usdAmount, to, fiatRatesUsd, cryptoPricesUsdt);
}
