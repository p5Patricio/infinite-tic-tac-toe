/**
 * AnalyticsManager — Capa de abstracción para Firebase Analytics.
 *
 * En desarrollo (Expo Go): los eventos se loguean a consola.
 * En producción (EAS Build): conectar @react-native-firebase/analytics
 * y reemplazar los métodos mock por los reales.
 *
 * Pasos para activar en producción:
 * 1. npm install @react-native-firebase/app @react-native-firebase/analytics
 * 2. Seguir guía de Expo: https://docs.expo.dev/guides/using-firebase/
 * 3. Colocar google-services.json en android/app/ y GoogleService-Info.plist en ios/
 * 4. Agregar plugins de RN Firebase a app.json
 * 5. Reemplazar las funciones mock de este archivo por las reales.
 */

type AnalyticsEvent =
  | 'game_started'
  | 'game_won'
  | 'online_match_made'
  | 'ad_impression'
  | 'ad_clicked'
  | 'settings_changed';

const IS_DEV = __DEV__;

function logToConsole(event: AnalyticsEvent, params?: Record<string, unknown>): void {
  if (IS_DEV) {
    console.log(`[Analytics] ${event}`, params ?? '');
  }
}

export const AnalyticsManager = {
  logEvent: (event: AnalyticsEvent, params?: Record<string, unknown>): void => {
    logToConsole(event, params);
    // TODO: producción — descomentar tras instalar @react-native-firebase/analytics
    // import analytics from '@react-native-firebase/analytics';
    // analytics().logEvent(event, params);
  },

  logGameStarted: (mode: string) => {
    AnalyticsManager.logEvent('game_started', { mode });
  },

  logGameWon: (mode: string, winner: string, moves: number) => {
    AnalyticsManager.logEvent('game_won', { mode, winner, moves });
  },

  logOnlineMatchMade: (roomId: string) => {
    AnalyticsManager.logEvent('online_match_made', { room_id: roomId });
  },

  logAdImpression: (type: 'banner' | 'interstitial') => {
    AnalyticsManager.logEvent('ad_impression', { ad_type: type });
  },

  logSettingsChanged: (setting: string, value: string | boolean) => {
    AnalyticsManager.logEvent('settings_changed', { setting, value: String(value) });
  },
};
