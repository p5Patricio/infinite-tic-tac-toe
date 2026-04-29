import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameMode, Player } from '@/types/game';
import { HomeScreen } from '@/screens/HomeScreen';
import { GameScreen } from '@/screens/GameScreen';
import { LobbyScreen } from '@/screens/LobbyScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: { mode: GameMode; roomId?: string; player?: Player };
  Lobby: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
