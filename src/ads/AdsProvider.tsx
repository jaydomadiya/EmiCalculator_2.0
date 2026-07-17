import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { InterstitialAd, AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from './adUnitIds';
import { AdsConfig, DEFAULT_ADS_CONFIG } from './config';
import CustomAdModal from './CustomAdModal';

export type InteractionKind = 'click' | 'back';

// Minimum gap between two app-open ads (AdMob policy: don't show on every resume).
const APP_OPEN_MIN_INTERVAL_MS = 60000;

type AdsContextValue = {
  config: AdsConfig;
  // Call on every navigation click / hardware back. The provider decides,
  // based on the Remote Config counters + cooldown, whether to surface a
  // full-screen Google interstitial or the custom-link house ad.
  registerInteraction: (kind: InteractionKind) => void;
  // Call when the Home screen mounts. Shows the home_popup message once per
  // session if home_popup_enabled is set in Remote Config.
  maybeShowHomePopup: () => void;
};

const AdsContext = createContext<AdsContextValue>({
  config: DEFAULT_ADS_CONFIG,
  registerInteraction: () => undefined,
  maybeShowHomePopup: () => undefined,
});

export function useAds(): AdsContextValue {
  return useContext(AdsContext);
}

// DEFAULT_ADS_CONFIG stays faithful to the schema (ads_enabled / custom_link_enabled
// false) so production is correct. In a dev build we force both on so every ad type
// is visible on-device without a Remote Config round-trip. Phase 2 replaces this
// initial value with fetched Remote Config values (keeping this as the fallback).
const INITIAL_CONFIG: AdsConfig = __DEV__
  ? {
      ...DEFAULT_ADS_CONFIG,
      ads_enabled: true,
      custom_link_enabled: true,
      home_popup_enabled: true,
      home_popup_title: 'Welcome to EMI Studio',
      home_popup_message: 'Plan smarter — check out our featured pick, just for you.',
      app_open_enabled: true,
    }
  : DEFAULT_ADS_CONFIG;

export function AdsProvider({ children }: { children: ReactNode }) {
  const [config] = useState<AdsConfig>(INITIAL_CONFIG);
  const [customAdVisible, setCustomAdVisible] = useState(false);
  const [homePopupVisible, setHomePopupVisible] = useState(false);
  const homePopupShownRef = useRef(false);

  const configRef = useRef<AdsConfig>(config);
  configRef.current = config;

  const interstitialRef = useRef<InterstitialAd | null>(null);
  const interstitialLoadedRef = useRef(false);
  const lastFullScreenAtRef = useRef(0);
  const clickCountRef = useRef(0);
  const backCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appOpenRef = useRef<AppOpenAd | null>(null);
  const appOpenLoadedRef = useRef(false);
  const appOpenShowingRef = useRef(false);
  const coldStartPendingRef = useRef(true);
  const lastAppOpenAtRef = useRef(0);
  // Set true right before WE present any full-screen ad (interstitial / app-open).
  // Those ads background the app, so the following AppState 'active' is a return
  // from our own ad — not a genuine app resume — and must NOT trigger app-open.
  const suppressAppOpenRef = useRef(false);

  const loadInterstitial = useCallback(() => {
    const cfg = configRef.current;
    if (!cfg.ads_enabled || !cfg.interstitial_enabled) {
      return;
    }
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });
    interstitialRef.current = ad;
    interstitialLoadedRef.current = false;

    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadedRef.current = true;
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoadedRef.current = false;
      loadInterstitial();
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      // Real ad units no-fill routinely. Without a retry a single failed load
      // would kill interstitials for the whole session, so reload after a delay.
      interstitialLoadedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => loadInterstitial(), 30000);
    });
    ad.load();
  }, []);

  useEffect(() => {
    loadInterstitial();
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [loadInterstitial]);

  const showAppOpenIfReady = useCallback(() => {
    const cfg = configRef.current;
    if (!cfg.ads_enabled || !cfg.app_open_enabled) {
      return;
    }
    // AdMob policy: app-open must not fire on every resume. Throttle to at most
    // once per APP_OPEN_MIN_INTERVAL_MS (the cold-start show is exempt).
    const now = Date.now();
    if (!coldStartPendingRef.current && now - lastAppOpenAtRef.current < APP_OPEN_MIN_INTERVAL_MS) {
      return;
    }
    const ad = appOpenRef.current;
    if (ad && appOpenLoadedRef.current && !appOpenShowingRef.current) {
      appOpenShowingRef.current = true;
      suppressAppOpenRef.current = true;
      lastAppOpenAtRef.current = now;
      lastFullScreenAtRef.current = now;
      ad.show().catch(() => {
        appOpenShowingRef.current = false;
      });
    }
  }, []);

  const loadAppOpen = useCallback(() => {
    const cfg = configRef.current;
    if (!cfg.ads_enabled || !cfg.app_open_enabled) {
      return;
    }
    const ad = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen, {
      requestNonPersonalizedAdsOnly: false,
    });
    appOpenRef.current = ad;
    appOpenLoadedRef.current = false;

    ad.addAdEventListener(AdEventType.LOADED, () => {
      appOpenLoadedRef.current = true;
      // Cold start: show the first app-open ad as soon as it loads (this is the
      // "Ads Loading" -> ad flow), but only within the initial window so a slow
      // load never interrupts a mid-session user.
      if (coldStartPendingRef.current) {
        coldStartPendingRef.current = false;
        showAppOpenIfReady();
      }
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenLoadedRef.current = false;
      appOpenShowingRef.current = false;
      loadAppOpen();
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      appOpenLoadedRef.current = false;
      appOpenShowingRef.current = false;
    });
    ad.load();
  }, [showAppOpenIfReady]);

  useEffect(() => {
    loadAppOpen();
    // After a few seconds the cold-start window closes; a later load won't
    // auto-show (it waits for a genuine background -> foreground instead).
    const coldStartTimer = setTimeout(() => {
      coldStartPendingRef.current = false;
    }, 6000);

    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        return;
      }
      if (suppressAppOpenRef.current) {
        // Returning from our own full-screen ad — don't stack another app-open.
        suppressAppOpenRef.current = false;
        return;
      }
      showAppOpenIfReady();
    });

    return () => {
      clearTimeout(coldStartTimer);
      subscription.remove();
    };
  }, [loadAppOpen, showAppOpenIfReady]);

  const showInterstitialIfReady = useCallback((now: number): boolean => {
    const ad = interstitialRef.current;
    if (ad && interstitialLoadedRef.current) {
      lastFullScreenAtRef.current = now;
      interstitialLoadedRef.current = false;
      suppressAppOpenRef.current = true;
      ad.show().catch(() => undefined);
      return true;
    }
    return false;
  }, []);

  const registerInteraction = useCallback(
    (kind: InteractionKind) => {
      const cfg = configRef.current;
      if (!cfg.ads_enabled) {
        return;
      }

      let interstitialDue = false;
      let customDue = false;

      if (kind === 'click') {
        clickCountRef.current += 1;
        const c = clickCountRef.current;
        interstitialDue =
          cfg.interstitial_enabled &&
          cfg.interstitial_after_click > 0 &&
          c % cfg.interstitial_after_click === 0;
        customDue =
          cfg.custom_link_enabled &&
          cfg.custom_link_after_click > 0 &&
          c % cfg.custom_link_after_click === 0;
      } else {
        backCountRef.current += 1;
        const b = backCountRef.current;
        interstitialDue =
          cfg.interstitial_enabled &&
          cfg.interstitial_after_back > 0 &&
          b % cfg.interstitial_after_back === 0;
        customDue =
          cfg.custom_link_enabled &&
          cfg.custom_link_after_back > 0 &&
          b % cfg.custom_link_after_back === 0;
      }

      // One global cooldown covers both ad types, so two full-screen ads never
      // fire back-to-back. Counters still advance during the cooldown window.
      const now = Date.now();
      if (now - lastFullScreenAtRef.current < cfg.interstitial_delay_second * 1000) {
        return;
      }

      // Precedence: a ready Google interstitial wins over the custom link when
      // both are due on the same interaction.
      if (interstitialDue && showInterstitialIfReady(now)) {
        return;
      }
      if (customDue) {
        lastFullScreenAtRef.current = now;
        setCustomAdVisible(true);
      }
    },
    [showInterstitialIfReady],
  );

  const maybeShowHomePopup = useCallback(() => {
    const cfg = configRef.current;
    if (cfg.home_popup_enabled && !homePopupShownRef.current) {
      homePopupShownRef.current = true;
      setHomePopupVisible(true);
    }
  }, []);

  return (
    <AdsContext.Provider value={{ config, registerInteraction, maybeShowHomePopup }}>
      {children}
      <CustomAdModal
        visible={customAdVisible}
        url={config.custom_link}
        onClose={() => setCustomAdVisible(false)}
      />
      <CustomAdModal
        visible={homePopupVisible}
        variant="message"
        url={config.custom_link}
        title={config.home_popup_title}
        subtitle={config.home_popup_message}
        onClose={() => setHomePopupVisible(false)}
      />
    </AdsContext.Provider>
  );
}
