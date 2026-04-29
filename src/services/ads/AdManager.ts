import { useGameStore } from '@/store/gameStore';

// ─── MOCK / DEV MODE ─────────────────────────────────────────────
// En desarrollo (Expo Go), AdMob nativo no está disponible.
// Estos mocks loguean a consola para facilitar testing sin crash.
// En producción (EAS Build), se usa el SDK real.
// ─── REEMPLAZAR CON IDS REALES ANTES DE PRODUCCION ──────────────

const IS_MOCK = __DEV__;

// Placeholder IDs de prueba de Google (test ads)
const BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const INTERSTITIAL_AD_UNIT_ID_ANDROID = 'ca-app-pub-3940256099942544/1033173712';

let interstitialLoaded = false;

// Lazy imports para evitar crash en Expo Go si el módulo nativo falla
let MobileAds: typeof import('react-native-google-mobile-ads').MobileAds | null = null;
let InterstitialAd: typeof import('react-native-google-mobile-ads').InterstitialAd | null = null;
let AdEventType: typeof import('react-native-google-mobile-ads').AdEventType | null = null;
try {
  const admob = require('react-native-google-mobile-ads');
  MobileAds = admob.MobileAds;
  InterstitialAd = admob.InterstitialAd;
  AdEventType = admob.AdEventType;
} catch {
  console.warn('[AdManager] react-native-google-mobile-ads no disponible. Usando mocks.');
}

export function getBannerAdUnitId(): string {
  // En prod, usar process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID / _IOS
  // Por ahora, placeholders de test
  return BANNER_AD_UNIT_ID_ANDROID;
}

export async function initializeAds(): Promise<void> {
  if (IS_MOCK) {
    console.log('[AD] initializeAds() mock');
    return;
  }
  if (!MobileAds) return;
  await MobileAds().initialize();
  console.log('[AD] AdMob initialized');
}

export function shouldShowAds(): boolean {
  const adsRemoved = useGameStore.getState().adsRemoved;
  return !adsRemoved;
}

export async function loadInterstitial(): Promise<void> {
  if (IS_MOCK) {
    console.log('[AD] loadInterstitial() mock');
    interstitialLoaded = true;
    return;
  }
  if (!InterstitialAd) return;

  const adUnitId = INTERSTITIAL_AD_UNIT_ID_ANDROID;
  const interstitial = InterstitialAd.createForAdRequest(adUnitId);

  interstitial.load();

  // Esperar carga
  return new Promise((resolve) => {
    const unsubLoaded = interstitial.addAdEventListener(AdEventType!.LOADED, () => {
      interstitialLoaded = true;
      unsubLoaded();
      resolve();
    });
    const unsubError = interstitial.addAdEventListener(AdEventType!.ERROR, () => {
      interstitialLoaded = false;
      unsubError();
      resolve();
    });
  });
}

export async function showInterstitial(): Promise<boolean> {
  if (!shouldShowAds()) {
    console.log('[AD] Ads removed, skipping interstitial');
    return false;
  }

  if (IS_MOCK) {
    console.log('[AD] showInterstitial() mock');
    return true;
  }

  if (!InterstitialAd || !interstitialLoaded) return false;

  // Crear nuevo y mostrar (simplificado; en prod se reutiliza la instancia cargada)
  const adUnitId = INTERSTITIAL_AD_UNIT_ID_ANDROID;
  const interstitial = InterstitialAd.createForAdRequest(adUnitId);

  return new Promise((resolve) => {
    const unsub = interstitial.addAdEventListener(AdEventType!.LOADED, () => {
      interstitial.show();
      interstitialLoaded = false;
      unsub();
      resolve(true);
    });
    interstitial.load();
  });
}

export function incrementGameCounter(): void {
  useGameStore.getState().incrementInterstitialCounter();
}

export function shouldShowInterstitial(): boolean {
  if (!shouldShowAds()) return false;
  const counter = useGameStore.getState().interstitialCounter;
  return counter >= 3;
}

export function resetGameCounter(): void {
  useGameStore.getState().resetInterstitialCounter();
}
