import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
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
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { updateGameState } from '@/services/firebase/roomService';

type GameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Game'
>;
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

export function GameScreen(): React.ReactElement {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { mode, roomId, player } = route.params ?? { mode: 'local' };

  const gameState = useGameStore((s) => s.gameState);
  const makeMoveLocal = useGameStore((s) => s.makeMove);
  const resetGame = useGameStore((s) => s.resetGame);
  const theme = useGameStore((s) => s.theme);
  const colors = getColors(theme);

  const isOnline = mode === 'online';
  const myPlayer = player ?? 'X';

  const { isConnected, opponentDisconnected } = useOnlineGame(
    isOnline ? roomId : undefined,
    isOnline ? myPlayer : undefined
  );

  useEffect(() => {
    resetGame(mode);
  }, [mode]);

  // Alerta de desconexión del oponente
  useEffect(() => {
    if (opponentDisconnected && isOnline) {
      Alert.alert(
        'Oponente desconectado',
        'Tu oponente se ha desconectado.',
        [
          { text: 'Menú', onPress: () => navigation.navigate('Home') },
          { text: 'Esperar', style: 'cancel' },
        ]
      );
    }
  }, [opponentDisconnected, isOnline, navigation]);

  const handleCellPress = useCallback(
    (position: number) => {
      if (gameState.isGameOver) return;

      if (isOnline) {
        // Validar que sea nuestro turno
        if (gameState.currentPlayer !== myPlayer) {
          return;
        }
        // Hacer movimiento local y sincronizar
        makeMoveLocal(position);
        if (roomId) {
          const newState = useGameStore.getState().gameState;
          updateGameState(roomId, newState).catch((err) => {
            console.error('Failed to sync move:', err);
          });
        }
      } else {
        makeMoveLocal(position);
      }
    },
    [gameState.isGameOver, gameState.currentPlayer, isOnline, myPlayer, roomId, makeMoveLocal]
  );

  const modeLabel =
    mode === 'local'
      ? '2 Jugadores'
      : mode === 'ai'
      ? 'Vs IA'
      : mode === 'zen'
      ? 'Modo Zen'
      : 'Online';

  const statusText = isOnline
    ? opponentDisconnected
      ? 'Oponente desconectado'
      : isConnected
      ? 'Conectado'
      : 'Conectando...'
    : null;

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {modeLabel}
          </Text>
          {statusText && (
            <Text
              style={[
                styles.statusText,
                {
                  color: opponentDisconnected
                    ? colors.playerX
                    : colors.textSecondary,
                },
              ]}
            >
              {statusText}
            </Text>
          )}
        </View>
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
        {isOnline && (
          <Text style={[styles.myPlayerText, { color: colors.textSecondary }]}>
            Tú eres {myPlayer}
          </Text>
        )}
      </View>

      {/* Board */}
      <View style={styles.boardContainer}>
        <Board onCellPress={handleCellPress} />
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    marginTop: 2,
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
  myPlayerText: {
    fontSize: 14,
    marginTop: 4,
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
