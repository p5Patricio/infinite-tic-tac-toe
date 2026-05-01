import { Audio } from 'expo-av';
import { useGameStore } from '@/store/gameStore';

type SoundKey = 'place' | 'win' | 'disappear';

const soundModules: Record<SoundKey, number> = {
  place: require('@/assets/sounds/place.mp3'),
  win: require('@/assets/sounds/win.mp3'),
  disappear: require('@/assets/sounds/disappear.mp3'),
};

const soundCache: Partial<Record<SoundKey, Audio.Sound>> = {};

async function getSound(key: SoundKey): Promise<Audio.Sound | null> {
  if (soundCache[key]) {
    return soundCache[key]!;
  }

  try {
    const { sound } = await Audio.Sound.createAsync(soundModules[key], {
      shouldPlay: false,
    });
    soundCache[key] = sound;
    return sound;
  } catch (err) {
    // Archivo de sonido no disponible o error de carga — silenciar
    return null;
  }
}

async function play(key: SoundKey): Promise<void> {
  const { soundEnabled } = useGameStore.getState();
  if (!soundEnabled) return;

  const sound = await getSound(key);
  if (!sound) return;

  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Ignorar errores de reproducción
  }
}

export const AudioManager = {
  playPlace: () => play('place'),
  playWin: () => play('win'),
  playDisappear: () => play('disappear'),
};
