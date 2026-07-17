import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// Real AdMob ad unit IDs go here once the user creates them in the AdMob console.
// Until then these stay as the Google-provided test unit IDs (safe to click, no ban risk).
// IMPORTANT: test IDs are always used in __DEV__ builds regardless of the values below,
// so real IDs only ever serve in a production (release) build.
const PROD_AD_UNITS = {
  banner: {
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
  },
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  },
  native: {
    android: 'ca-app-pub-3940256099942544/2247696110',
    ios: 'ca-app-pub-3940256099942544/3986624511',
  },
  appOpen: {
    android: 'ca-app-pub-3940256099942544/9257395921',
    ios: 'ca-app-pub-3940256099942544/5575463023',
  },
  rewarded: {
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
  },
};

function pick(pair: { android: string; ios: string }): string {
  return Platform.OS === 'ios' ? pair.ios : pair.android;
}

export const AD_UNIT_IDS = {
  banner: __DEV__ ? TestIds.BANNER : pick(PROD_AD_UNITS.banner),
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : pick(PROD_AD_UNITS.interstitial),
  native: __DEV__ ? TestIds.NATIVE : pick(PROD_AD_UNITS.native),
  appOpen: __DEV__ ? TestIds.APP_OPEN : pick(PROD_AD_UNITS.appOpen),
  rewarded: __DEV__ ? TestIds.REWARDED : pick(PROD_AD_UNITS.rewarded),
};
