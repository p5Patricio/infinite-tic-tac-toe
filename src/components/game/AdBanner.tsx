import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';
import { shouldShowAds, getBannerAdUnitId } from '@/services/ads/AdManager';

let BannerAd: React.ComponentType<any> | null = null;
let BannerAdSize: Record<string, string> | null = null;

try {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
} catch {
  // Módulo nativo no disponible (Expo Go)
}

interface AdBannerProps {
  visible?: boolean;
}

export function AdBanner({ visible = true }: AdBannerProps): React.ReactElement | null {
  const theme = useGameStore((s) => s.theme);
  const colors = getColors(theme);

  if (!visible || !shouldShowAds()) {
    return null;
  }

  const adUnitId = getBannerAdUnitId();

  if (__DEV__ || !BannerAd || !BannerAdSize) {
    // Mock / Expo Go placeholder
    return (
      <View style={[styles.mockBanner, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={[styles.mockText, { color: colors.textSecondary }]}>
          [AD] Banner placeholder
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error: any) => {
          console.warn('[AD] Banner failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mockBanner: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockText: {
    fontSize: 12,
  },
});
