import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameMode } from '@/types/game';
import {
  createInitialState,
  makeMove as engineMakeMove,
} from '@/services/game/GameEngine';

interface GameStoreState {
  // Game state
  gameState: GameState;

  // Settings
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'light' | 'dark';
  adsRemoved: boolean;
  interstitialCounter: number;

  // Actions
  makeMove: (position: number) => void;
  resetGame: (mode?: GameMode) => void;
  setGameMode: (mode: GameMode) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  toggleTheme: () => void;
  setAdsRemoved: (removed: boolean) => void;
  incrementInterstitialCounter: () => void;
  resetInterstitialCounter: () => void;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      gameState: createInitialState(),
      soundEnabled: true,
      hapticEnabled: true,
      theme: 'dark',
      adsRemoved: false,
      interstitialCounter: 0,

      makeMove: (position: number) => {
        const { gameState } = get();
        if (gameState.isGameOver) return;
        const newState = engineMakeMove(gameState, position);
        set({ gameState: newState });
      },

      resetGame: (mode?: GameMode) => {
        const currentMode = mode ?? get().gameState.gameMode;
        set({
          gameState: createInitialState({ gameMode: currentMode }),
        });
      },

      setGameMode: (mode: GameMode) => {
        set({
          gameState: createInitialState({ gameMode: mode }),
        });
      },

      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

      toggleHaptic: () =>
        set((state) => ({ hapticEnabled: !state.hapticEnabled })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setAdsRemoved: (removed: boolean) =>
        set({ adsRemoved: removed }),

      incrementInterstitialCounter: () =>
        set((state) => ({
          interstitialCounter: state.interstitialCounter + 1,
        })),

      resetInterstitialCounter: () =>
        set({ interstitialCounter: 0 }),
    }),
    {
      name: 'infinite-ttt-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        hapticEnabled: state.hapticEnabled,
        theme: state.theme,
        adsRemoved: state.adsRemoved,
        interstitialCounter: state.interstitialCounter,
      }),
    }
  )
);
