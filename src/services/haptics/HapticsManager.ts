import * as Haptics from 'expo-haptics';
import { useGameStore } from '@/store/gameStore';

function enabled(): boolean {
  return useGameStore.getState().hapticEnabled;
}

export const HapticsManager = {
  hapticPlace: async () => {
    if (!enabled()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignorar si haptics no está disponible
    }
  },

  hapticDisappear: async () => {
    if (!enabled()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignorar
    }
  },

  hapticWin: async () => {
    if (!enabled()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignorar
    }
  },
};
