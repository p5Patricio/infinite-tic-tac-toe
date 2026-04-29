import React, { useEffect } from 'react';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useGameStore } from '@/store/gameStore';
import { initializeAds } from '@/services/ads/AdManager';

function AppInner(): React.ReactElement {
  const initAuth = useGameStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
    initializeAds().catch(() => {
      // Silenciar errores de inicialización de ads
    });
  }, [initAuth]);

  return <AppNavigator />;
}

export default function App(): React.ReactElement {
  return <AppInner />;
}
