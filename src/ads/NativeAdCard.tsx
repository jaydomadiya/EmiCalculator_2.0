import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useAds } from './AdsProvider';
import { isNativeVisible, NativePlacement } from './config';
import NativeAdLoader from './NativeAdLoader';
import { THEME, hexToRgba } from '../theme/colors';

type NativeAdCardProps = {
  placement: NativePlacement;
  format?: 'compact' | 'medium';
};

const NATIVE_AD_LOAD_TIMEOUT_MS = 15000;

function getAdErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown AdMob error';
  }
}

function AdCardBackground() {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[THEME.cardBg, '#F7FAF8', '#FFFCF4']}
        locations={[0, 0.62, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.goldAccent} />
    </>
  );
}

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
    let timeout: ReturnType<typeof setTimeout> | null = null;
    setNativeAd(null);
    setFailed(false);

    timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AdMob] Native ad load timed out', { placement, format, unitId });
        setFailed(true);
      }
    }, NATIVE_AD_LOAD_TIMEOUT_MS);

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
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        current = ad;
        setNativeAd(ad);
      })
      // Load failed (e.g. no-fill): mark failed so the slot collapses instead
      // of showing a skeleton forever.
      .catch((error: unknown) => {
        if (!cancelled) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          console.warn('[AdMob] Native ad failed to load', {
            placement,
            format,
            unitId,
            error: getAdErrorMessage(error),
          });
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      current?.destroy();
      setNativeAd(null);
    };
  }, [format, unitId, visible]);

  if (!visible || failed) {
    return null;
  }

  // Firebase can hide the loader while keeping the ad request active. When
  // enabled, the premium placeholder matches the final compact/medium layout.
  if (!nativeAd) {
    return config.native_loader_enabled ? <NativeAdLoader format={format} /> : null;
  }

  if (format === 'compact') {
    return (
      <NativeAdView nativeAd={nativeAd} style={styles.compactCard}>
        <AdCardBackground />
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
      <AdCardBackground />
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
  goldAccent: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: THEME.gold,
    opacity: 0.78,
  },
  mediumCard: {
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    paddingRight: 38,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: hexToRgba(THEME.gold, 0.24),
    boxShadow: `0 8px 24px ${hexToRgba(THEME.primaryDark, 0.08)}`,
  },
  compactCard: {
    minHeight: 102,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 8,
    padding: 10,
    paddingRight: 38,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: hexToRgba(THEME.gold, 0.24),
    boxShadow: `0 8px 24px ${hexToRgba(THEME.primaryDark, 0.08)}`,
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
    color: THEME.text,
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
    backgroundColor: hexToRgba(THEME.primary, 0.08),
  },
  compactCopy: {
    flex: 1,
    minWidth: 0,
  },
  compactBody: {
    fontSize: 11.5,
    lineHeight: 15,
    color: THEME.subtext,
  },
  compactAdvertiser: {
    marginTop: 2,
    fontSize: 10.5,
    color: THEME.subtext,
  },
  compactCta: {
    minWidth: 76,
    maxWidth: 96,
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: THEME.primary,
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
    backgroundColor: hexToRgba(THEME.primary, 0.08),
  },
  headerText: {
    flex: 1,
  },
  headline: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  advertiser: {
    fontSize: 12,
    color: THEME.subtext,
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
    color: THEME.subtext,
    marginTop: 8,
  },
  media: {
    width: '100%',
    height: 140,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: hexToRgba(THEME.primary, 0.08),
  },
  cta: {
    marginTop: 10,
    backgroundColor: THEME.primary,
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
