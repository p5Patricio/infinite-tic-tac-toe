import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  playerX: string;
  playerO: string;
  ghostX: string;
  ghostO: string;
  winning: string;
  overlay: string;
  buttonBg: string;
  buttonText: string;
  disabled: string;
}

export const lightTheme: ThemeColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceHighlight: '#E8E8ED',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#C7C7CC',
  primary: '#007AFF',
  playerX: '#FF6B6B',
  playerO: '#4ECDC4',
  ghostX: 'rgba(255, 107, 107, 0.3)',
  ghostO: 'rgba(78, 205, 196, 0.3)',
  winning: '#FFD93D',
  overlay: 'rgba(0, 0, 0, 0.7)',
  buttonBg: '#007AFF',
  buttonText: '#FFFFFF',
  disabled: '#C7C7CC',
};

export const darkTheme: ThemeColors = {
  background: '#0F0F23',
  surface: '#1C1C2E',
  surfaceHighlight: '#2A2A3E',
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  border: '#3A3A4E',
  primary: '#0A84FF',
  playerX: '#FF6B6B',
  playerO: '#4ECDC4',
  ghostX: 'rgba(255, 107, 107, 0.3)',
  ghostO: 'rgba(78, 205, 196, 0.3)',
  winning: '#FFD93D',
  overlay: 'rgba(0, 0, 0, 0.7)',
  buttonBg: '#0A84FF',
  buttonText: '#FFFFFF',
  disabled: '#3A3A4E',
};

export function getColors(mode: ThemeMode): ThemeColors {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'light' ? lightTheme : darkTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
}
