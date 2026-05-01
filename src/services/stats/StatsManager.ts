import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  gamesPlayed: 'stats_gamesPlayed',
  gamesWon: 'stats_gamesWon',
  currentStreak: 'stats_currentStreak',
  bestStreak: 'stats_bestStreak',
};

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
}



async function getNumber(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return 0;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
}

async function setNumber(key: string, value: number): Promise<void> {
  await AsyncStorage.setItem(key, String(value));
}

export async function loadStats(): Promise<GameStats> {
  const [gamesPlayed, gamesWon, currentStreak, bestStreak] = await Promise.all([
    getNumber(KEYS.gamesPlayed),
    getNumber(KEYS.gamesWon),
    getNumber(KEYS.currentStreak),
    getNumber(KEYS.bestStreak),
  ]);
  return { gamesPlayed, gamesWon, currentStreak, bestStreak };
}

export async function recordGameResult(won: boolean): Promise<GameStats> {
  const stats = await loadStats();
  stats.gamesPlayed += 1;
  if (won) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
  } else {
    stats.currentStreak = 0;
  }

  await Promise.all([
    setNumber(KEYS.gamesPlayed, stats.gamesPlayed),
    setNumber(KEYS.gamesWon, stats.gamesWon),
    setNumber(KEYS.currentStreak, stats.currentStreak),
    setNumber(KEYS.bestStreak, stats.bestStreak),
  ]);

  return stats;
}

export async function resetStats(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.gamesPlayed),
    AsyncStorage.removeItem(KEYS.gamesWon),
    AsyncStorage.removeItem(KEYS.currentStreak),
    AsyncStorage.removeItem(KEYS.bestStreak),
  ]);
}
