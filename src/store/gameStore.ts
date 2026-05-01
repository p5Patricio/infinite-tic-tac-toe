import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameMode, UserProfile, AIDifficulty } from '@/types/game';
import {
  createInitialState,
  makeMove as engineMakeMove,
} from '@/services/game/GameEngine';
import { signInAnonymously } from '@/services/firebase/auth';
import { createUserProfile } from '@/services/firebase/userService';
import { isFirebaseReady } from '@/services/firebase/config';
import { loadStats, recordGameResult, resetStats } from '@/services/stats/StatsManager';

interface GameStoreState {
  // Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnlineAvailable: boolean;

  // Game state
  gameState: GameState;

  // Settings
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  adsRemoved: boolean;
  interstitialCounter: number;
  aiDifficulty: AIDifficulty;

  // Stats
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;

  // Actions
  initAuth: () => Promise<void>;
  makeMove: (position: number) => void;
  resetGame: (mode?: GameMode) => void;
  setGameMode: (mode: GameMode) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAdsRemoved: (removed: boolean) => void;
  incrementInterstitialCounter: () => void;
  resetInterstitialCounter: () => void;
  setAIDifficulty: (difficulty: AIDifficulty) => void;

  // Stats actions
  loadStatsAsync: () => Promise<void>;
  recordWin: () => Promise<void>;
  recordLoss: () => Promise<void>;
  resetStatsAsync: () => Promise<void>;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnlineAvailable: isFirebaseReady,
      gameState: createInitialState(),
      soundEnabled: true,
      hapticEnabled: true,
      theme: 'system',
      adsRemoved: false,
      interstitialCounter: 0,
      aiDifficulty: 'medium',
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      bestStreak: 0,

      initAuth: async () => {
        try {
          const profile = await signInAnonymously();
          if (isFirebaseReady) {
            await createUserProfile(profile.uid).catch(() => {
              // Ignorar errores de creación de perfil
            });
          }
          set({ user: profile, isAuthenticated: true });
        } catch (error) {
          console.error('Auth initialization failed:', error);
        }
      },

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
        set((state) => {
          const cycle: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];
          const idx = cycle.indexOf(state.theme);
          const next = cycle[(idx + 1) % cycle.length];
          return { theme: next };
        }),

      setTheme: (theme) => set({ theme }),

      setAdsRemoved: (removed: boolean) =>
        set({ adsRemoved: removed }),

      incrementInterstitialCounter: () =>
        set((state) => ({
          interstitialCounter: state.interstitialCounter + 1,
        })),

      resetInterstitialCounter: () =>
        set({ interstitialCounter: 0 }),

      setAIDifficulty: (difficulty: AIDifficulty) =>
        set({ aiDifficulty: difficulty }),

      loadStatsAsync: async () => {
        try {
          const stats = await loadStats();
          set(stats);
        } catch {
          // Ignorar errores de carga de stats
        }
      },

      recordWin: async () => {
        try {
          const stats = await recordGameResult(true);
          set(stats);
        } catch {
          // Ignorar
        }
      },

      recordLoss: async () => {
        try {
          const stats = await recordGameResult(false);
          set(stats);
        } catch {
          // Ignorar
        }
      },

      resetStatsAsync: async () => {
        try {
          await resetStats();
          set({ gamesPlayed: 0, gamesWon: 0, currentStreak: 0, bestStreak: 0 });
        } catch {
          // Ignorar
        }
      },
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
        aiDifficulty: state.aiDifficulty,
        gamesPlayed: state.gamesPlayed,
        gamesWon: state.gamesWon,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
      }),
    }
  )
);
