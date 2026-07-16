const RATES_ENDPOINT = 'https://open.er-api.com/v6/latest/USD';
const FETCH_TIMEOUT_MS = 10000;

export type RatesFetchResult = {
  rates: Record<string, number>;
  updatedAt: string;
  isLive: boolean;
};

// Approximate reference rates (relative to USD), bundled so the converter still
// works when the device has no internet connection. Only used as a fallback —
// clearly labelled as offline/reference data in the UI, never presented as live.
export const FALLBACK_RATES_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 86.4,
  JPY: 156,
  AUD: 1.52,
  CAD: 1.37,
  CHF: 0.88,
  CNY: 7.24,
  HKD: 7.82,
  SGD: 1.34,
  NZD: 1.64,
  KRW: 1360,
  AED: 3.67,
  SAR: 3.75,
  ZAR: 18.2,
  BRL: 5.1,
  MXN: 17.1,
  RUB: 90,
  TRY: 34.5,
  THB: 34.9,
  MYR: 4.5,
  IDR: 15900,
  PHP: 56.5,
  PKR: 279,
  BDT: 119,
  LKR: 300,
  NPR: 133.5,
  EGP: 48.5,
  NGN: 1550,
  KES: 129,
};

export async function fetchLiveRates(): Promise<RatesFetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(RATES_ENDPOINT, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Exchange rate request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data?.result !== 'success' || !data.rates) {
      throw new Error('Unexpected response from exchange rate service');
    }

    return {
      rates: data.rates as Record<string, number>,
      updatedAt: typeof data.time_last_update_utc === 'string' ? data.time_last_update_utc : '',
      isLive: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  ratesUsd: Record<string, number>,
): number | null {
  const fromRate = ratesUsd[fromCode];
  const toRate = ratesUsd[toCode];
  if (!fromRate || !toRate || Number.isNaN(amount)) {
    return null;
  }
  return (amount / fromRate) * toRate;
}
