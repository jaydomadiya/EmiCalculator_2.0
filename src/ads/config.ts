// AdsConfig mirrors the Firebase Remote Config schema 1:1.
// Every key name here MUST match the Remote Config parameter name verbatim,
// because Phase 2 loads these same keys straight from Remote Config.
export type AdsConfig = {
  // ADS SETTINGS
  ads_enabled: boolean;
  banner_enabled: boolean;
  native_enabled: boolean;
  interstitial_enabled: boolean;
  app_open_enabled: boolean;
  reward_enabled: boolean;

  // INTERSTITIAL CONTROL
  interstitial_after_click: number;
  interstitial_after_back: number;
  interstitial_delay_second: number;

  // CUSTOM LINK (custom advertisement)
  custom_link_enabled: boolean;
  custom_link: string;
  custom_link_after_click: number;
  custom_link_after_back: number;

  // BANNER POSITION
  banner_home: boolean;
  banner_article: boolean;
  banner_category: boolean;
  banner_tools: boolean;

  // NATIVE POSITION
  native_home: boolean;
  native_article: boolean;
  native_category: boolean;

  // APP UPDATE
  force_update: boolean;
  latest_version: string;

  // MESSAGE
  home_popup_enabled: boolean;
  home_popup_title: string;
  home_popup_message: string;

  // API
  maintenance: boolean;

  // ONBOARDING
  // How many of the (currently 4) onboarding slides to show, front-to-back.
  // Clamped in OnboardingScreen — values outside 1..slide-count are ignored.
  onboarding_screen_count: number;

  // SPLASH AD
  // Shows the custom_link sponsor ad once, right after the splash screen
  // hides — independent of the click/back cadence below. Requires
  // ads_enabled + custom_link_enabled to also be true.
  splash_ad_enabled: boolean;

  // AD UNIT IDS (Android) — real AdMob unit IDs, swappable from the Firebase
  // console without an app release. __DEV__ builds ignore these and always
  // use Google's TestIds instead (see adUnitIds.ts).
  android_banner_ad_unit_id: string;
  android_interstitial_ad_unit_id: string;
  android_native_ad_unit_id: string;
  android_app_open_ad_unit_id: string;
  android_rewarded_ad_unit_id: string;
};

// These defaults match the Firebase Remote Config schema EXACTLY (ads_enabled and
// custom_link_enabled are false, like real kill-switches). In Phase 2 this object
// becomes the in-app Remote Config fallback, so on first launch — or if a fetch
// fails — the app behaves as the console intends (ads off until turned on).
// Local dev visibility is handled separately by a __DEV__ override in AdsProvider,
// so running builds still show ads without weakening the production defaults.
export const DEFAULT_ADS_CONFIG: AdsConfig = {
  ads_enabled: false,
  banner_enabled: true,
  native_enabled: true,
  interstitial_enabled: true,
  app_open_enabled: false,
  reward_enabled: false,

  // full-screen ad on every 3rd tap (user example: 1st=loan, 2nd=emi, 3rd=ad)
  interstitial_after_click: 3,
  interstitial_after_back: 2,
  // interstitial_delay_second: 10,
  interstitial_delay_second: 3, // shorter shared cooldown so the every-3rd-tap ad isn't suppressed

  custom_link_enabled: false,
  custom_link: 'https://example.com',
  // custom_link_after_click: 2,
  custom_link_after_click: 3, // align with interstitial so taps 1 & 2 stay ad-free; 3rd tap shows custom if Google no-fills
  custom_link_after_back: 1,

  banner_home: true,
  banner_article: true,
  banner_category: true,
  // banner_tools: false,
  banner_tools: true, // bottom banner on all other screens (converter/investment/other/planner/chart/settings)

  native_home: true,
  native_article: true,
  native_category: false,

  force_update: false,
  latest_version: '1.0.0',

  home_popup_enabled: false,
  home_popup_title: '',
  home_popup_message: '',

  maintenance: false,

  onboarding_screen_count: 4,
  splash_ad_enabled: false,

  // Fallback to Google's public test ad unit IDs until real ones are set in
  // the Firebase console (safe to click, no ban risk).
  android_banner_ad_unit_id: 'ca-app-pub-3940256099942544/6300978111',
  android_interstitial_ad_unit_id: 'ca-app-pub-3940256099942544/1033173712',
  android_native_ad_unit_id: 'ca-app-pub-3940256099942544/2247696110',
  android_app_open_ad_unit_id: 'ca-app-pub-3940256099942544/9257395921',
  android_rewarded_ad_unit_id: 'ca-app-pub-3940256099942544/5224354917',
};

// The schema comes from a news/blog template (home / article / category / tools).
// This app has no such screens, so each placement maps to the closest EMI screen:
//   home     -> HomeScreen
//   article  -> LoanResultScreen        (the "content" / result detail page)
//   category -> LoanCalculatorScreen     (the loan-type input page)
//   tools    -> converter / investment / other-calculator tool screens
export type BannerPlacement = 'home' | 'article' | 'category' | 'tools';
export type NativePlacement = 'home' | 'article' | 'category';

export function isBannerVisible(config: AdsConfig, placement: BannerPlacement): boolean {
  if (!config.ads_enabled || !config.banner_enabled) {
    return false;
  }
  switch (placement) {
    case 'home':
      return config.banner_home;
    case 'article':
      return config.banner_article;
    case 'category':
      return config.banner_category;
    case 'tools':
      return config.banner_tools;
    default:
      return false;
  }
}

export function isNativeVisible(config: AdsConfig, placement: NativePlacement): boolean {
  if (!config.ads_enabled || !config.native_enabled) {
    return false;
  }
  switch (placement) {
    case 'home':
      return config.native_home;
    case 'article':
      return config.native_article;
    case 'category':
      return config.native_category;
    default:
      return false;
  }
}
