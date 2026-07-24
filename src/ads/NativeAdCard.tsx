import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  NativeAd,
  NativeAdChoicesPlacement,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaAspectRatio,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { getAdUnitIds } from './adUnitIds';
import { SkeletonBlock } from './AdSkeleton';
import { useAds } from './AdsProvider';
import { isNativeVisible, NativePlacement } from './config';

type NativeAdCardProps = {
  placement: NativePlacement;
  format?: 'compact' | 'medium';
};

// Google native advanced ads styled to match the app. The compact layout
// replaces the old banner slots without consuming a large part of fixed-footer
// screens; the medium layout remains available for in-content placements.
// Native ads MUST be destroyed on unmount. The "Ad" badge is required by AdMob
// policy, and clickable pieces are wrapped in <NativeAsset> so taps are
// attributed. Explicit dimensions avoid the Fabric 0-height issue.
function NativeAdCard({ placement, format = 'medium' }: NativeAdCardProps) {
  const { config } = useAds();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [failed, setFailed] = useState(false);

  const visible = isNativeVisible(config, placement);
  const unitId = getAdUnitIds(config).native;

  useEffect(() => {
    if (!visible) {
      return;
    }
    let current: NativeAd | null = null;
    let cancelled = false;
    setNativeAd(null);
    setFailed(false);

    NativeAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: false,
      aspectRatio:
        format === 'medium' ? NativeMediaAspectRatio.LANDSCAPE : NativeMediaAspectRatio.ANY,
      // The SDK adds AdChoices automatically. Keeping it top-right and
      // reserving that corner in both layouts prevents asset overlap.
      adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
    })
      .then(ad => {
        if (cancelled) {
          ad.destroy();
          return;
        }
        current = ad;
        setNativeAd(ad);
      })
      // Load failed (e.g. no-fill): mark failed so the slot collapses instead
      // of showing a skeleton forever.
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      current?.destroy();
      setNativeAd(null);
    };
  }, [format, unitId, visible]);

  if (!visible || failed) {
    return null;
  }

  // Ad still loading: show a skeleton shaped like the real card so the layout
  // is stable and the user sees a UI-matched loading state.
  if (!nativeAd) {
    if (format === 'compact') {
      return (
        <View style={styles.compactCard}>
          <View style={styles.compactHeader}>
            <SkeletonBlock style={styles.skCompactBadge} />
            <SkeletonBlock style={styles.skCompactHeadline} />
          </View>
          <View style={styles.compactBodyRow}>
            <SkeletonBlock style={styles.skCompactIcon} />
            <View style={styles.compactCopy}>
              <SkeletonBlock style={styles.skCompactBody1} />
              <SkeletonBlock style={styles.skCompactBody2} />
            </View>
            <SkeletonBlock style={styles.skCompactCta} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mediumCard}>
        <View style={styles.headerRow}>
          <SkeletonBlock style={styles.skIcon} />
          <View style={styles.headerText}>
            <SkeletonBlock style={styles.skLineLg} />
            <SkeletonBlock style={styles.skLineSm} />
          </View>
          <SkeletonBlock style={styles.skBadge} />
        </View>
        <SkeletonBlock style={styles.skBodyLine1} />
        <SkeletonBlock style={styles.skBodyLine2} />
        <SkeletonBlock style={styles.skMedia} />
        <SkeletonBlock style={styles.skCta} />
      </View>
    );
  }

  if (format === 'compact') {
    return (
      <NativeAdView nativeAd={nativeAd} style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <Text style={styles.adBadge}>Ad</Text>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.compactHeadline} numberOfLines={1}>
              {nativeAd.headline}
            </Text>
          </NativeAsset>
        </View>

        <View style={styles.compactBodyRow}>
          {nativeAd.icon?.url ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image source={{ uri: nativeAd.icon.url }} style={styles.compactIcon} />
            </NativeAsset>
          ) : null}

          <View style={styles.compactCopy}>
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text style={styles.compactBody} numberOfLines={2}>
                {nativeAd.body}
              </Text>
            </NativeAsset>
            {nativeAd.advertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.compactAdvertiser} numberOfLines={1}>
                  {nativeAd.advertiser}
                </Text>
              </NativeAsset>
            ) : null}
          </View>

          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View style={styles.compactCta}>
              <Text style={styles.compactCtaText} numberOfLines={1}>
                {nativeAd.callToAction || 'Open'}
              </Text>
            </View>
          </NativeAsset>
        </View>
      </NativeAdView>
    );
  }

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.mediumCard}>
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
  mediumCard: {
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    paddingRight: 38,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactCard: {
    minHeight: 102,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 8,
    padding: 10,
    paddingRight: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactHeader: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  compactHeadline: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  compactBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 7,
  },
  compactIcon: {
    width: 46,
    height: 46,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
  },
  compactCopy: {
    flex: 1,
    minWidth: 0,
  },
  compactBody: {
    fontSize: 11.5,
    lineHeight: 15,
    color: '#475569',
  },
  compactAdvertiser: {
    marginTop: 2,
    fontSize: 10.5,
    color: '#64748B',
  },
  compactCta: {
    minWidth: 76,
    maxWidth: 96,
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: '#0E9F6E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCtaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
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
  // Loading-skeleton shapes (mirror the real card layout above).
  skIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  skLineLg: {
    height: 13,
    width: '65%',
    borderRadius: 6,
    marginBottom: 7,
  },
  skLineSm: {
    height: 10,
    width: '40%',
    borderRadius: 6,
  },
  skBadge: {
    width: 22,
    height: 14,
    borderRadius: 4,
  },
  skBodyLine1: {
    height: 10,
    width: '100%',
    borderRadius: 6,
    marginTop: 12,
  },
  skBodyLine2: {
    height: 10,
    width: '80%',
    borderRadius: 6,
    marginTop: 7,
  },
  skMedia: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 10,
  },
  skCta: {
    height: 42,
    width: '100%',
    borderRadius: 10,
    marginTop: 10,
  },
  skCompactBadge: {
    width: 22,
    height: 16,
    borderRadius: 4,
  },
  skCompactHeadline: {
    flex: 1,
    height: 12,
    borderRadius: 6,
  },
  skCompactIcon: {
    width: 46,
    height: 46,
    borderRadius: 9,
  },
  skCompactBody1: {
    width: '100%',
    height: 9,
    borderRadius: 5,
    marginBottom: 7,
  },
  skCompactBody2: {
    width: '72%',
    height: 9,
    borderRadius: 5,
  },
  skCompactCta: {
    width: 80,
    height: 38,
    borderRadius: 9,
  },
});

export default NativeAdCard;
