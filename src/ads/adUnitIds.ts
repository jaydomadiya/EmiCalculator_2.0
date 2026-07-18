import { TestIds } from 'react-native-google-mobile-ads';
import { AdsConfig } from './config';

export type AdUnitIds = {
  banner: string;
  interstitial: string;
  native: string;
  appOpen: string;
  rewarded: string;
};

// Ad unit IDs now come from Firebase Remote Config (android_*_ad_unit_id),
// so they can be swapped from the console without an app release.
// __DEV__ builds ALWAYS use Google's TestIds regardless of Remote Config,
// so real ad units only ever serve in a production (release) build.
export function getAdUnitIds(config: AdsConfig): AdUnitIds {
  if (__DEV__) {
    return {
      banner: TestIds.BANNER,
      interstitial: TestIds.INTERSTITIAL,
      native: TestIds.NATIVE,
      appOpen: TestIds.APP_OPEN,
      rewarded: TestIds.REWARDED,
    };
  }

  return {
    banner: config.android_banner_ad_unit_id,
    interstitial: config.android_interstitial_ad_unit_id,
    native: config.android_native_ad_unit_id,
    appOpen: config.android_app_open_ad_unit_id,
    rewarded: config.android_rewarded_ad_unit_id,
  };
}
