import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from './adUnitIds';
import { useAds } from './AdsProvider';
import { BannerPlacement, isBannerVisible } from './config';

type AdBannerProps = {
  placement: BannerPlacement;
};

// Renders a Google banner only when Remote Config allows it for this placement
// (ads_enabled && banner_enabled && banner_<placement>). Otherwise renders
// nothing so the layout collapses cleanly.
function AdBanner({ placement }: AdBannerProps) {
  const { config } = useAds();

  if (!isBannerVisible(config, placement)) {
    return null;
  }

  return (
    <View style={styles.slot}>
      <BannerAd unitId={AD_UNIT_IDS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
});

export default AdBanner;
