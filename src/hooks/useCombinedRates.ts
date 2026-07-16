import { useEffect, useState } from 'react';
import {
  CryptoRatesFetchResult,
  FALLBACK_CRYPTO_PRICES_USDT,
  fetchLiveCryptoPrices,
} from '../utils/cryptoRates';
import { FALLBACK_RATES_USD, RatesFetchResult, fetchLiveRates } from '../utils/currencyRates';

export type LoadState = 'loading' | 'success' | 'error';

const CACHE_TTL_MS = 5 * 60 * 1000;

// Module-level cache shared by every screen that uses this hook. Without it,
// navigating between the four converter screens re-fetched and re-parsed the
// full live rates payload (166 fiat rates + ~700 live crypto prices out of a
// ~3600-entry Binance response) on every single visit, which is what caused
// the noticeable lag. Now that work happens once per TTL window.
let fiatCache: { data: RatesFetchResult; fetchedAt: number } | null = null;
let fiatInFlight: Promise<RatesFetchResult> | null = null;

let cryptoCache: { data: CryptoRatesFetchResult; fetchedAt: number } | null = null;
let cryptoInFlight: Promise<CryptoRatesFetchResult> | null = null;

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}

function getFiatRates(forceRefresh: boolean): Promise<RatesFetchResult> {
  if (!forceRefresh && fiatCache && isFresh(fiatCache.fetchedAt)) {
    return Promise.resolve(fiatCache.data);
  }
  if (!forceRefresh && fiatInFlight) {
    return fiatInFlight;
  }
  const promise = fetchLiveRates()
    .then(result => {
      fiatCache = { data: result, fetchedAt: Date.now() };
      fiatInFlight = null;
      return result;
    })
    .catch(err => {
      fiatInFlight = null;
      throw err;
    });
  fiatInFlight = promise;
  return promise;
}

function getCryptoPrices(forceRefresh: boolean): Promise<CryptoRatesFetchResult> {
  if (!forceRefresh && cryptoCache && isFresh(cryptoCache.fetchedAt)) {
    return Promise.resolve(cryptoCache.data);
  }
  if (!forceRefresh && cryptoInFlight) {
    return cryptoInFlight;
  }
  const promise = fetchLiveCryptoPrices()
    .then(result => {
      cryptoCache = { data: result, fetchedAt: Date.now() };
      cryptoInFlight = null;
      return result;
    })
    .catch(err => {
      cryptoInFlight = null;
      throw err;
    });
  cryptoInFlight = promise;
  return promise;
}

export function useCombinedRates() {
  const [fiatState, setFiatState] = useState<LoadState>(
    fiatCache && isFresh(fiatCache.fetchedAt) ? 'success' : 'loading',
  );
  const [fiatResult, setFiatResult] = useState<RatesFetchResult | null>(fiatCache?.data ?? null);
  const [cryptoState, setCryptoState] = useState<LoadState>(
    cryptoCache && isFresh(cryptoCache.fetchedAt) ? 'success' : 'loading',
  );
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number> | null>(
    cryptoCache?.data.pricesUsdt ?? null,
  );

  const loadFiat = async (forceRefresh = false) => {
    setFiatState('loading');
    try {
      const result = await getFiatRates(forceRefresh);
      setFiatResult(result);
      setFiatState('success');
    } catch {
      setFiatState('error');
    }
  };

  const loadCrypto = async (forceRefresh = false) => {
    setCryptoState('loading');
    try {
      const result = await getCryptoPrices(forceRefresh);
      setCryptoPrices(result.pricesUsdt);
      setCryptoState('success');
    } catch {
      setCryptoState('error');
    }
  };

  useEffect(() => {
    if (!(fiatCache && isFresh(fiatCache.fetchedAt))) {
      loadFiat();
    }
    if (!(cryptoCache && isFresh(cryptoCache.fetchedAt))) {
      loadCrypto();
    }
  }, []);

  const isFiatOffline = fiatState === 'error';
  const isCryptoOffline = cryptoState === 'error';
  const fiatRates = fiatResult?.rates ?? (isFiatOffline ? FALLBACK_RATES_USD : null);
  const cryptoRates = cryptoPrices ?? (isCryptoOffline ? FALLBACK_CRYPTO_PRICES_USDT : null);

  return {
    fiatRates,
    cryptoRates,
    fiatUpdatedAt: fiatResult?.updatedAt ?? '',
    fiatState,
    cryptoState,
    isFiatOffline,
    isCryptoOffline,
    isLoading: (fiatState === 'loading' && !fiatRates) || (cryptoState === 'loading' && !cryptoRates),
    reloadFiat: () => loadFiat(true),
    reloadCrypto: () => loadCrypto(true),
  };
}
