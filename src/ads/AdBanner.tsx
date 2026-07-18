import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnitIds } from './adUnitIds';
import { SkeletonBlock } from './AdSkeleton';
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
  // Until the banner reports LOADED we show a skeleton the same height as the
  // banner; on FAILED we collapse the slot so no empty gap is left behind.
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  if (!isBannerVisible(config, placement)) {
    return null;
  }

  if (status === 'failed') {
    return null;
  }

  return (
    <View style={styles.slot}>
      {status === 'loading' ? <SkeletonBlock style={styles.skeleton} /> : null}
      <BannerAd
        unitId={getAdUnitIds(config).banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setStatus('loaded')}
        onAdFailedToLoad={() => setStatus('failed')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  skeleton: {
    width: '100%',
    height: 56,
    borderRadius: 10,
  },
});

export default AdBanner;
