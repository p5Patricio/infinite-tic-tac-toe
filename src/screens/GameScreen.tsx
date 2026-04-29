import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Board } from '@/components/game/Board';
import { PlayerIndicator } from '@/components/game/PlayerIndicator';
import { WinOverlay } from '@/components/game/WinOverlay';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';

type GameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Game'
>;
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

export function GameScreen(): React.ReactElement {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { mode } = route.params ?? { mode: 'local' };

  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const theme = useGameStore((s) => s.theme);
  const colors = getColors(theme);

  useEffect(() => {
    resetGame(mode);
  }, [mode]);

  const modeLabel =
    mode === 'local'
      ? '2 Jugadores'
      : mode === 'ai'
      ? 'Vs IA'
      : mode === 'zen'
      ? 'Modo Zen'
      : 'Online';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {modeLabel}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Turn indicator */}
      <View style={styles.turnContainer}>
        <Text style={[styles.turnText, { color: colors.textSecondary }]}>
          Turno de{' '}
          <Text
            style={[
              styles.turnPlayer,
              {
                color:
                  gameState.currentPlayer === 'X'
                    ? colors.playerX
                    : colors.playerO,
              },
            ]}
          >
            {gameState.currentPlayer}
          </Text>
        </Text>
      </View>

      {/* Board */}
      <View style={styles.boardContainer}>
        <Board />
      </View>

      {/* Player indicator */}
      <PlayerIndicator />

      {/* Banner placeholder */}
      <View style={styles.bannerPlaceholder} />

      {/* Win overlay */}
      <WinOverlay
        onPlayAgain={() => resetGame(mode)}
        onMenu={() => navigation.navigate('Home')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  turnContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  turnText: {
    fontSize: 18,
  },
  turnPlayer: {
    fontWeight: 'bold',
    fontSize: 22,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerPlaceholder: {
    height: 60,
  },
});
