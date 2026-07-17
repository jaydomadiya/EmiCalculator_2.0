import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from './adUnitIds';
import { useAds } from './AdsProvider';
import { isNativeVisible, NativePlacement } from './config';

type NativeAdCardProps = {
  placement: NativePlacement;
};

// A Google native advanced ad rendered as an in-content card, styled to match
// the rest of the app (not the reference app's spammy density). Native ads are
// loaded asynchronously and MUST be destroyed on unmount. The "Ad" badge is
// required by AdMob policy, and clickable pieces are wrapped in <NativeAsset>
// so taps are attributed. Explicit dimensions avoid the Fabric 0-height issue.
function NativeAdCard({ placement }: NativeAdCardProps) {
  const { config } = useAds();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  const visible = isNativeVisible(config, placement);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let current: NativeAd | null = null;
    let cancelled = false;

    NativeAd.createForAdRequest(AD_UNIT_IDS.native, {
      requestNonPersonalizedAdsOnly: false,
    })
      .then(ad => {
        if (cancelled) {
          ad.destroy();
          return;
        }
        current = ad;
        setNativeAd(ad);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      current?.destroy();
      setNativeAd(null);
    };
  }, [visible]);

  if (!visible || !nativeAd) {
    return null;
  }

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.card}>
      <View style={styles.headerRow}>
        {nativeAd.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
          </NativeAsset>
        ) : null}
        <View style={styles.headerText}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.headline} numberOfLines={1}>
              {nativeAd.headline}
            </Text>
          </NativeAsset>
          {nativeAd.advertiser ? (
            <NativeAsset assetType={NativeAssetType.ADVERTISER}>
              <Text style={styles.advertiser} numberOfLines={1}>
                {nativeAd.advertiser}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
        <Text style={styles.adBadge}>Ad</Text>
      </View>

      {nativeAd.body ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text style={styles.body} numberOfLines={2}>
            {nativeAd.body}
          </Text>
        </NativeAsset>
      ) : null}

      <NativeMediaView style={styles.media} resizeMode="cover" />

      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{nativeAd.callToAction || 'Learn More'}</Text>
        </View>
      </NativeAsset>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerText: {
    flex: 1,
  },
  headline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  advertiser: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  adBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  body: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 8,
  },
  media: {
    width: '100%',
    height: 140,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cta: {
    marginTop: 10,
    backgroundColor: '#0E9F6E',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default NativeAdCard;
