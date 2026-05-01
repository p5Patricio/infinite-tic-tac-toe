import { useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { useGameStore } from '@/store/gameStore';

export function useTheme(): 'light' | 'dark' {
  const storeTheme = useGameStore((s) => s.theme);

  const resolve = (t: typeof storeTheme): 'light' | 'dark' => {
    if (t !== 'system') return t;
    return Appearance.getColorScheme() || 'dark';
  };

  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    resolve(storeTheme)
  );

  useEffect(() => {
    if (storeTheme !== 'system') {
      setResolved(storeTheme);
      return;
    }

    setResolved(Appearance.getColorScheme() || 'dark');

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setResolved(colorScheme || 'dark');
    });

    return () => subscription.remove();
  }, [storeTheme]);

  return resolved;
}
