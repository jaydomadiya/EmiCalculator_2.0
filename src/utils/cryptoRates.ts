const BINANCE_TICKER_ENDPOINT = 'https://api.binance.com/api/v3/ticker/price';
const FETCH_TIMEOUT_MS = 10000;

export type CryptoRatesFetchResult = {
  pricesUsdt: Record<string, number>;
};

// Approximate reference prices (in USDT), bundled so the converter still works
// offline. Only used as a fallback — clearly labelled in the UI, never shown
// as live.
export const FALLBACK_CRYPTO_PRICES_USDT: Record<string, number> = {
  BTC: 64000,
  ETH: 1880,
  USDT: 1,
  USDC: 1,
  BNB: 575,
  XRP: 0.5,
  SOL: 140,
  ADA: 0.4,
  DOGE: 0.12,
  TRX: 0.12,
  TON: 5.5,
  AVAX: 25,
  SHIB: 0.000018,
  DOT: 5.5,
  LINK: 13,
  MATIC: 0.6,
  LTC: 70,
  BCH: 350,
  ATOM: 7,
  XLM: 0.1,
};

function isLeveragedOrScaledSymbol(base: string): boolean {
  return /^\d/.test(base) || /(UP|DOWN|BULL|BEAR)$/.test(base);
}

export async function fetchLiveCryptoPrices(): Promise<CryptoRatesFetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(BINANCE_TICKER_ENDPOINT, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Crypto price request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response from crypto price service');
    }

    const pricesUsdt: Record<string, number> = {};
    for (const entry of data as Array<{ symbol?: string; price?: string }>) {
      const symbol = entry.symbol;
      if (!symbol || !symbol.endsWith('USDT')) {
        continue;
      }
      const base = symbol.slice(0, -4);
      if (!base || isLeveragedOrScaledSymbol(base)) {
        continue;
      }
      const price = Number(entry.price);
      if (!Number.isFinite(price) || price <= 0) {
        continue;
      }
      pricesUsdt[base] = price;
    }
    pricesUsdt.USDT = 1;

    return { pricesUsdt };
  } finally {
    clearTimeout(timeoutId);
  }
}
