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
import { getApp } from '@react-native-firebase/app';
import {
  fetchAndActivate,
  getAll,
  getRemoteConfig,
  RemoteConfig,
} from '@react-native-firebase/remote-config';
import { getAdUnitIds } from './adUnitIds';
import { AdsConfig, DEFAULT_ADS_CONFIG } from './config';
import CustomAdModal from './CustomAdModal';
import SponsorAdScreen from './SponsorAdScreen';
import InterstitialAdLoader from './interstitial-ad-loader';

export type InteractionKind = 'click' | 'back';

// Minimum gap between two app-open ads (AdMob policy: don't show on every resume).
const APP_OPEN_MIN_INTERVAL_MS = 60000;
// Onboarding briefly waits for a preloaded ad, but never blocks the user's flow
// when the network is slow or AdMob has no inventory.
const ONBOARDING_INTERSTITIAL_WAIT_MS = 2500;
// Keep malformed Remote Config values from blocking the user for an
// unreasonable amount of time.
const MAX_INTERSTITIAL_LOADER_DURATION_SECONDS = 15;
const INTERSTITIAL_LOADER_FAILSAFE_BUFFER_MS = 5000;

type InterstitialLoaderTiming = {
  startedAt: number;
  durationMs: number;
};

export type RegisterInteractionOptions = {
  // Only Home-screen-originated clicks are eligible to show the custom_link
  // sponsor ad — everywhere else only the Google interstitial competes. This
  // keeps the two ad types from fighting over the same click (see the
  // interstitial-vs-custom precedence note in registerInteraction below).
  customAdEligible?: boolean;
};

type AdsContextValue = {
  config: AdsConfig;
  // Call on every navigation click / hardware back. The provider decides,
  // based on the Remote Config counters + cooldown, whether to surface a
  // full-screen Google interstitial or the custom-link house ad. The promise
  // resolves after an interstitial closes, so back navigation can safely wait
  // without changing the existing fire-and-forget click flow.
  registerInteraction: (
    kind: InteractionKind,
    opts?: RegisterInteractionOptions,
  ) => Promise<boolean>;
  // Onboarding is a deliberate full-screen transition point. When Firebase
  // enables ads + interstitials, show one before advancing and resolve after
  // it closes. A missing/no-fill ad resolves false so onboarding never stalls.
  showOnboardingInterstitial: () => Promise<boolean>;
  // Call when the Home screen mounts. Shows the home_popup message once per
  // session if home_popup_enabled is set in Remote Config.
  maybeShowHomePopup: () => void;
};

const AdsContext = createContext<AdsContextValue>({
  config: DEFAULT_ADS_CONFIG,
  registerInteraction: async () => false,
  showOnboardingInterstitial: async () => false,
  maybeShowHomePopup: () => undefined,
});

export function useAds(): AdsContextValue {
  return useContext(AdsContext);
}

// --- Manual test-ads config (superseded by real Firebase Remote Config below).
// This was the local override used before Remote Config was wired up — every
// build (dev AND release) forced these values so all ad formats always showed.
// Left here, commented, only as a quick local-debug escape hatch: flip
// ENABLE_LOCAL_ADS to true to bypass Firebase entirely.
//
// const ENABLE_LOCAL_ADS = true;
//
// const INITIAL_CONFIG: AdsConfig = ENABLE_LOCAL_ADS
//   ? {
//       ...DEFAULT_ADS_CONFIG,
//       ads_enabled: true,
//       custom_link_enabled: true,
//       home_popup_enabled: true,
//       home_popup_title: 'Welcome to EMI Studio',
//       home_popup_message: 'Plan smarter — check out our featured pick, just for you.',
//       app_open_enabled: true,
//     }
//   : DEFAULT_ADS_CONFIG;

// Reads every AdsConfig key back out of a fetched-and-activated RemoteConfig
// instance. Key names below match the Firebase Remote Config console verbatim
// (see config.ts). Falls back to DEFAULT_ADS_CONFIG per-key so a param missing
// from the console (not yet created) never produces an undefined/NaN value.
function readAdsConfig(remoteConfig: RemoteConfig): AdsConfig {
  const values = getAll(remoteConfig);
  const bool = (key: keyof AdsConfig) =>
    values[key] ? values[key].asBoolean() : (DEFAULT_ADS_CONFIG[key] as boolean);
  const num = (key: keyof AdsConfig) =>
    values[key] ? values[key].asNumber() : (DEFAULT_ADS_CONFIG[key] as number);
  const str = (key: keyof AdsConfig) =>
    values[key]?.asString() || (DEFAULT_ADS_CONFIG[key] as string);

  return {
    ads_enabled: bool('ads_enabled'),
    banner_enabled: bool('banner_enabled'),
    native_enabled: bool('native_enabled'),
    native_loader_enabled: bool('native_loader_enabled'),
    interstitial_enabled: bool('interstitial_enabled'),
    interstitial_loader_enabled: bool('interstitial_loader_enabled'),
    interstitial_loader_duration_second: num('interstitial_loader_duration_second'),
    app_open_enabled: bool('app_open_enabled'),
    reward_enabled: bool('reward_enabled'),

    interstitial_after_click: num('interstitial_after_click'),
    interstitial_after_back: num('interstitial_after_back'),
    interstitial_delay_second: num('interstitial_delay_second'),

    custom_link_enabled: bool('custom_link_enabled'),
    custom_link: str('custom_link'),
    custom_link_after_click: num('custom_link_after_click'),
    custom_link_after_back: num('custom_link_after_back'),

    banner_home: bool('banner_home'),
    banner_article: bool('banner_article'),
    banner_category: bool('banner_category'),
    banner_tools: bool('banner_tools'),

    native_home: bool('native_home'),
    native_article: bool('native_article'),
    native_category: bool('native_category'),
    native_tools: bool('native_tools'),

    force_update: bool('force_update'),
    latest_version: str('latest_version'),

    home_popup_enabled: bool('home_popup_enabled'),
    home_popup_title: str('home_popup_title'),
    home_popup_message: str('home_popup_message'),

    maintenance: bool('maintenance'),

    onboarding_screen_count: num('onboarding_screen_count'),
    splash_ad_enabled: bool('splash_ad_enabled'),

    android_banner_ad_unit_id: str('android_banner_ad_unit_id'),
    android_interstitial_ad_unit_id: str('android_interstitial_ad_unit_id'),
    android_native_ad_unit_id: str('android_native_ad_unit_id'),
    android_app_open_ad_unit_id: str('android_app_open_ad_unit_id'),
    android_rewarded_ad_unit_id: str('android_rewarded_ad_unit_id'),
  };
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AdsConfig>(DEFAULT_ADS_CONFIG);
  const [customAdVisible, setCustomAdVisible] = useState(false);
  const [homePopupVisible, setHomePopupVisible] = useState(false);
  const [interstitialLoaderVisible, setInterstitialLoaderVisible] = useState(false);
  const homePopupShownRef = useRef(false);

  const configRef = useRef<AdsConfig>(config);
  configRef.current = config;

  const interstitialRef = useRef<InterstitialAd | null>(null);
  const interstitialLoadedRef = useRef(false);
  const interstitialShowingRef = useRef(false);
  const interstitialLoadWaitersRef = useRef(new Set<(isReady: boolean) => void>());
  const lastFullScreenAtRef = useRef(0);
  // Interstitial and custom-link ads now track SEPARATE click counters so
  // they never compete for the same interaction: interstitialClickCountRef
  // only advances on non-Home clicks, customClickCountRef only advances on
  // Home-screen clicks (customAdEligible).
  const interstitialClickCountRef = useRef(0);
  const customClickCountRef = useRef(0);
  const backCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interstitialLoaderStartedAtRef = useRef(0);
  const interstitialLoaderFailsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appOpenRef = useRef<AppOpenAd | null>(null);
  const appOpenLoadedRef = useRef(false);
  const appOpenShowingRef = useRef(false);
  const coldStartPendingRef = useRef(true);
  const lastAppOpenAtRef = useRef(0);
  // Set true right before WE present any full-screen ad (interstitial / app-open).
  // Those ads background the app, so the following AppState 'active' is a return
  // from our own ad — not a genuine app resume — and must NOT trigger app-open.
  const suppressAppOpenRef = useRef(false);

  const hideInterstitialLoader = useCallback(() => {
    interstitialLoaderStartedAtRef.current = 0;
    if (interstitialLoaderFailsafeRef.current) {
      clearTimeout(interstitialLoaderFailsafeRef.current);
      interstitialLoaderFailsafeRef.current = null;
    }
    setInterstitialLoaderVisible(false);
  }, []);

  const showInterstitialLoader = useCallback((): InterstitialLoaderTiming | null => {
    if (!configRef.current.interstitial_loader_enabled) {
      return null;
    }

    const configuredSeconds = configRef.current.interstitial_loader_duration_second;
    const fallbackSeconds = DEFAULT_ADS_CONFIG.interstitial_loader_duration_second;
    const safeSeconds =
      Number.isFinite(configuredSeconds) && configuredSeconds >= 0
        ? Math.min(configuredSeconds, MAX_INTERSTITIAL_LOADER_DURATION_SECONDS)
        : fallbackSeconds;
    const durationMs = safeSeconds * 1000;
    const startedAt = Date.now();
    interstitialLoaderStartedAtRef.current = startedAt;
    setInterstitialLoaderVisible(true);

    if (interstitialLoaderFailsafeRef.current) {
      clearTimeout(interstitialLoaderFailsafeRef.current);
    }
    interstitialLoaderFailsafeRef.current = setTimeout(
      hideInterstitialLoader,
      durationMs + INTERSTITIAL_LOADER_FAILSAFE_BUFFER_MS,
    );
    return { startedAt, durationMs };
  }, [hideInterstitialLoader]);

  const waitForInterstitialLoaderDuration = useCallback(
    (timing: InterstitialLoaderTiming | null): Promise<void> => {
      if (!timing) {
        return Promise.resolve();
      }
      const remaining = timing.durationMs - (Date.now() - timing.startedAt);
      if (remaining <= 0) {
        return Promise.resolve();
      }
      return new Promise(resolve => setTimeout(resolve, remaining));
    },
    [],
  );

  // Fetch + activate Firebase Remote Config once on mount. Defaults are set to
  // DEFAULT_ADS_CONFIG first so getAll() always has every key even before the
  // first successful network fetch (or if the device is offline on cold start).
  const didFetchRemoteConfigRef = useRef(false);
  useEffect(() => {
    if (didFetchRemoteConfigRef.current) {
      return;
    }
    didFetchRemoteConfigRef.current = true;

    const remoteConfig = getRemoteConfig(getApp());
    remoteConfig.settings = {
      // TEMP: forced to 0 for Remote Config testing so every app open fetches
      // fresh values instead of the throttled release cache. Set this back to
      // `__DEV__ ? 0 : 3600000` before shipping — 0 in production hits the
      // Remote Config API on every cold start, which is wasteful and can hit
      // Firebase's fetch quota under real traffic.
      minimumFetchIntervalMillis: 0,
      fetchTimeoutMillis: 30000,
    };
    remoteConfig.defaultConfig = DEFAULT_ADS_CONFIG;

    fetchAndActivate(remoteConfig)
      .catch(() => undefined)
      .finally(() => {
        setConfig(readAdsConfig(remoteConfig));
      });
  }, []);

  // Shows the custom_link sponsor ad once, right after Remote Config resolves
  // post-splash — independent of the click/back cadence in registerInteraction.
  // Runs as its own effect (rather than being called from App.tsx) so it never
  // races the async Remote Config fetch: it fires the instant `config` updates
  // with real values, whenever that happens to land.
  const splashAdShownRef = useRef(false);
  useEffect(() => {
    if (splashAdShownRef.current) {
      return;
    }
    if (config.ads_enabled && config.custom_link_enabled && config.splash_ad_enabled) {
      splashAdShownRef.current = true;
      setCustomAdVisible(true);
    }
  }, [config]);

  const notifyInterstitialLoadWaiters = useCallback((isReady: boolean) => {
    interstitialLoadWaitersRef.current.forEach(resolve => resolve(isReady));
    interstitialLoadWaitersRef.current.clear();
  }, []);

  const loadInterstitial = useCallback(() => {
    const cfg = configRef.current;
    if (!cfg.ads_enabled || !cfg.interstitial_enabled) {
      return;
    }
    const ad = InterstitialAd.createForAdRequest(getAdUnitIds(cfg).interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });
    interstitialRef.current = ad;
    interstitialLoadedRef.current = false;

    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadedRef.current = true;
      notifyInterstitialLoadWaiters(true);
    });
    ad.addAdEventListener(AdEventType.OPENED, hideInterstitialLoader);
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      hideInterstitialLoader();
      interstitialLoadedRef.current = false;
      interstitialShowingRef.current = false;
      loadInterstitial();
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      hideInterstitialLoader();
      // Real ad units no-fill routinely. Without a retry a single failed load
      // would kill interstitials for the whole session, so reload after a delay.
      interstitialLoadedRef.current = false;
      interstitialShowingRef.current = false;
      notifyInterstitialLoadWaiters(false);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => loadInterstitial(), 30000);
    });
    ad.load();
  }, [hideInterstitialLoader, notifyInterstitialLoadWaiters]);

  useEffect(() => {
    // Re-runs once Remote Config resolves (config identity changes), so the
    // ad loads for real instead of bailing on the ads_enabled=false default.
    loadInterstitial();
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (interstitialLoaderFailsafeRef.current) {
        clearTimeout(interstitialLoaderFailsafeRef.current);
      }
    };
  }, [loadInterstitial, config]);

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
    const ad = AppOpenAd.createForAdRequest(getAdUnitIds(cfg).appOpen, {
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
    // Re-runs once Remote Config resolves, same reasoning as the interstitial
    // effect above.
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
  }, [loadAppOpen, showAppOpenIfReady, config]);

  const showInterstitialIfReady = useCallback(async (
    now: number,
    shouldShowLoader: boolean,
  ): Promise<boolean> => {
    const ad = interstitialRef.current;
    if (ad && interstitialLoadedRef.current && !interstitialShowingRef.current) {
      lastFullScreenAtRef.current = now;
      interstitialLoadedRef.current = false;
      interstitialShowingRef.current = true;
      suppressAppOpenRef.current = true;
      // Back navigation must present the already-preloaded ad immediately.
      // Click-driven interstitials keep the Firebase-controlled branded loader.
      const loaderTiming = shouldShowLoader ? showInterstitialLoader() : null;

      await waitForInterstitialLoaderDuration(loaderTiming);

      return new Promise(resolve => {
        let settled = false;
        let unsubscribeClosed: () => void = () => undefined;
        let unsubscribeError: () => void = () => undefined;

        const finish = (wasShown: boolean) => {
          if (settled) {
            return;
          }
          settled = true;
          unsubscribeClosed();
          unsubscribeError();
          hideInterstitialLoader();
          interstitialShowingRef.current = false;
          if (!wasShown) {
            suppressAppOpenRef.current = false;
          }
          resolve(wasShown);
        };

        unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
        unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));

        Promise.resolve()
          .then(() => ad.show())
          .catch(() => {
            finish(false);
            loadInterstitial();
          });
      });
    }
    return false;
  }, [
    hideInterstitialLoader,
    loadInterstitial,
    showInterstitialLoader,
    waitForInterstitialLoaderDuration,
  ]);

  const waitForInterstitial = useCallback((): Promise<boolean> => {
    if (interstitialRef.current && interstitialLoadedRef.current) {
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout>;

      const finish = (isReady: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        interstitialLoadWaitersRef.current.delete(finish);
        resolve(isReady);
      };

      interstitialLoadWaitersRef.current.add(finish);
      timeout = setTimeout(() => finish(false), ONBOARDING_INTERSTITIAL_WAIT_MS);

      if (!interstitialRef.current) {
        loadInterstitial();
      }
    });
  }, [loadInterstitial]);

  const showOnboardingInterstitial = useCallback(async (): Promise<boolean> => {
    const cfg = configRef.current;
    if (!cfg.ads_enabled || !cfg.interstitial_enabled || interstitialShowingRef.current) {
      return false;
    }

    const loaderTiming = showInterstitialLoader();
    const isReady = await waitForInterstitial();
    const ad = interstitialRef.current;
    if (!isReady || !ad || !interstitialLoadedRef.current || interstitialShowingRef.current) {
      hideInterstitialLoader();
      return false;
    }

    await waitForInterstitialLoaderDuration(loaderTiming);
    lastFullScreenAtRef.current = Date.now();
    interstitialLoadedRef.current = false;
    interstitialShowingRef.current = true;
    suppressAppOpenRef.current = true;

    return new Promise(resolve => {
      let settled = false;
      let unsubscribeClosed: () => void = () => undefined;
      let unsubscribeError: () => void = () => undefined;

      const finish = (wasShown: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        unsubscribeClosed();
        unsubscribeError();
        interstitialShowingRef.current = false;
        hideInterstitialLoader();
        if (!wasShown) {
          suppressAppOpenRef.current = false;
        }
        resolve(wasShown);
      };

      unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
      unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));

      Promise.resolve()
        .then(() => ad.show())
        .catch(() => {
          finish(false);
          loadInterstitial();
        });
    });
  }, [
    hideInterstitialLoader,
    loadInterstitial,
    showInterstitialLoader,
    waitForInterstitial,
    waitForInterstitialLoaderDuration,
  ]);

  const registerInteraction = useCallback(
    async (
      kind: InteractionKind,
      opts?: RegisterInteractionOptions,
    ): Promise<boolean> => {
      const cfg = configRef.current;
      if (!cfg.ads_enabled) {
        return false;
      }
      const customAdEligible = opts?.customAdEligible ?? false;

      let interstitialDue = false;
      let customDue = false;

      if (kind === 'click') {
        // Interstitial counts EVERY click app-wide (Home included) — it's the
        // default ad. The sponsor ad has its own counter that only advances
        // on Home clicks; when both happen to be due on the same Home click,
        // the sponsor ad takes that one click instead of the interstitial
        // (see precedence below) — otherwise, with interstitial_after_click=1,
        // the interstitial would win literally every time and the sponsor ad
        // would never get a turn.
        interstitialClickCountRef.current += 1;
        const ic = interstitialClickCountRef.current;
        interstitialDue =
          cfg.interstitial_enabled &&
          cfg.interstitial_after_click > 0 &&
          ic % cfg.interstitial_after_click === 0;

        if (customAdEligible) {
          customClickCountRef.current += 1;
          const cc = customClickCountRef.current;
          customDue =
            cfg.custom_link_enabled &&
            cfg.custom_link_after_click > 0 &&
            cc % cfg.custom_link_after_click === 0;
        }
      } else {
        backCountRef.current += 1;
        const b = backCountRef.current;
        interstitialDue =
          cfg.interstitial_enabled &&
          cfg.interstitial_after_back > 0 &&
          b % cfg.interstitial_after_back === 0;
        customDue =
          customAdEligible &&
          cfg.custom_link_enabled &&
          cfg.custom_link_after_back > 0 &&
          b % cfg.custom_link_after_back === 0;
      }

      // Back interstitials are explicitly configured for every back action, so
      // they do not inherit the click/custom-ad cooldown. Other interactions
      // retain the shared cooldown and their existing counters.
      const now = Date.now();
      if (
        kind !== 'back' &&
        now - lastFullScreenAtRef.current < cfg.interstitial_delay_second * 1000
      ) {
        return false;
      }

      // Precedence: the sponsor ad wins when both are due on the same click.
      // Interstitial is the "default" ad on every other click; this is what
      // actually lets the sponsor ad surface on Home at all.
      if (customDue) {
        lastFullScreenAtRef.current = now;
        setCustomAdVisible(true);
        return true;
      }
      if (interstitialDue) {
        return showInterstitialIfReady(now, kind !== 'back');
      }
      return false;
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
    <AdsContext.Provider
      value={{
        config,
        registerInteraction,
        showOnboardingInterstitial,
        maybeShowHomePopup,
      }}
    >
      {children}
      <InterstitialAdLoader visible={interstitialLoaderVisible} />
      <SponsorAdScreen
        visible={customAdVisible}
        url={config.custom_link}
        onClose={() => setCustomAdVisible(false)}
      />
      <CustomAdModal
        visible={homePopupVisible}
        title={config.home_popup_title}
        subtitle={config.home_popup_message}
        onClose={() => setHomePopupVisible(false)}
      />
    </AdsContext.Provider>
  );
}
