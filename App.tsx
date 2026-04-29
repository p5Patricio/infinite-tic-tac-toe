import React, { useEffect } from 'react';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useGameStore } from '@/store/gameStore';

function AppInner(): React.ReactElement {
  const initAuth = useGameStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <AppNavigator />;
}

export default function App(): React.ReactElement {
  return <AppInner />;
}
