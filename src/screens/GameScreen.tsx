import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
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
import { getAIMove } from '@/services/game/AIEngine';
import { AdBanner } from '@/components/game/AdBanner';
import { useTheme } from '@/hooks/useTheme';
import {
  incrementGameCounter,
  shouldShowInterstitial,
  showInterstitial,
  resetGameCounter,
} from '@/services/ads/AdManager';
import { AudioManager } from '@/services/audio/AudioManager';
import { HapticsManager } from '@/services/haptics/HapticsManager';

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
  const recordWin = useGameStore((s) => s.recordWin);
  const recordLoss = useGameStore((s) => s.recordLoss);
  const storeTheme = useGameStore((s) => s.theme);
  const aiDifficulty = useGameStore((s) => s.aiDifficulty);
  const theme = useTheme();
  const colors = getColors(storeTheme);

  const isOnline = mode === 'online';
  const isAI = mode === 'ai';
  const myPlayer = player ?? 'X';

  const [aiThinking, setAiThinking] = useState(false);
  const dotAnim = useRef(new Animated.Value(0)).current;

  const { isConnected, opponentDisconnected } = useOnlineGame(
    isOnline ? roomId : undefined,
    isOnline ? myPlayer : undefined
  );

  // Refs for detecting board changes and game end
  const prevBoardRef = useRef(gameState.board);
  const gameEndedRef = useRef(false);
  const isFirstBoardChange = useRef(true);

  useEffect(() => {
    resetGame(mode);
  }, [mode]);

  // Animación de puntos para "IA pensando"
  useEffect(() => {
    if (!aiThinking) {
      dotAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [aiThinking]);

  // Detectar colocación y desaparición de fichas
  useEffect(() => {
    if (isFirstBoardChange.current) {
      isFirstBoardChange.current = false;
      prevBoardRef.current = gameState.board;
      return;
    }

    const prev = prevBoardRef.current;
    prevBoardRef.current = gameState.board;

    let placed = false;
    let disappeared = false;

    for (let i = 0; i < gameState.board.length; i++) {
      if (prev[i] === null && gameState.board[i] !== null) {
        placed = true;
      }
      if (prev[i] !== null && gameState.board[i] === null) {
        disappeared = true;
      }
    }

    if (placed) {
      AudioManager.playPlace().catch(() => {});
      HapticsManager.hapticPlace().catch(() => {});
    }
    if (disappeared) {
      AudioManager.playDisappear().catch(() => {});
      HapticsManager.hapticDisappear().catch(() => {});
    }
  }, [gameState.board]);

  // Detectar fin de partida y reproducir sonidos de victoria + stats
  useEffect(() => {
    if (gameState.isGameOver && !gameEndedRef.current) {
      gameEndedRef.current = true;

      if (gameState.winner && gameState.winner !== 'draw') {
        AudioManager.playWin().catch(() => {});
        HapticsManager.hapticWin().catch(() => {});

        if (mode !== 'online' && mode !== 'zen') {
          if (gameState.winner === myPlayer) {
            recordWin().catch(() => {});
          } else {
            recordLoss().catch(() => {});
          }
        }
      } else if (gameState.winner === 'draw') {
        if (mode !== 'online' && mode !== 'zen') {
          recordLoss().catch(() => {});
        }
      }
    }

    if (!gameState.isGameOver) {
      gameEndedRef.current = false;
    }
  }, [gameState.isGameOver, gameState.winner, mode, myPlayer, recordWin, recordLoss]);

  // Turno de la IA
  useEffect(() => {
    if (!isAI || gameState.isGameOver) return;
    if (gameState.currentPlayer !== 'O') return;

    setAiThinking(true);
    const delay = 400 + Math.random() * 400; // 400-800ms

    const timeout = setTimeout(() => {
      const move = getAIMove(gameState, aiDifficulty);
      setAiThinking(false);
      if (move >= 0 && move <= 8) {
        makeMoveLocal(move);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [gameState.currentPlayer, gameState.isGameOver, isAI, aiDifficulty, gameState.totalMoves]);

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
      if (aiThinking) return;

      if (isOnline) {
        if (gameState.currentPlayer !== myPlayer) return;
        makeMoveLocal(position);
        if (roomId) {
          const newState = useGameStore.getState().gameState;
          updateGameState(roomId, newState).catch((err) => {
            console.error('Failed to sync move:', err);
          });
        }
      } else if (isAI) {
        // Solo el humano (X) puede jugar, y solo cuando no está pensando la IA
        if (gameState.currentPlayer !== 'X') return;
        makeMoveLocal(position);
      } else {
        makeMoveLocal(position);
      }
    },
    [gameState.isGameOver, gameState.currentPlayer, isOnline, isAI, myPlayer, roomId, makeMoveLocal, aiThinking]
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
    : isAI
    ? aiDifficulty === 'easy'
      ? 'Fácil'
      : aiDifficulty === 'medium'
      ? 'Medio'
      : 'Difícil'
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{modeLabel}</Text>
          {statusText && (
            <Text
              style={[
                styles.statusText,
                {
                  color: opponentDisconnected ? colors.playerX : colors.textSecondary,
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
                  gameState.currentPlayer === 'X' ? colors.playerX : colors.playerO,
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

      {/* IA pensando */}
      {isAI && aiThinking && (
        <View style={styles.thinkingContainer}>
          <Animated.Text
            style={[styles.thinkingText, { color: colors.textSecondary, opacity: dotAnim }]}
          >
            🤖 IA está pensando...
          </Animated.Text>
        </View>
      )}

      {/* Board */}
      <View style={styles.boardContainer}>
        <Board onCellPress={handleCellPress} />
      </View>

      {/* Player indicator */}
      <PlayerIndicator />

      {/* Banner Ad */}
      <AdBanner visible={mode !== 'zen'} />

      {/* Win overlay */}
      <WinOverlay
        onPlayAgain={async () => {
          incrementGameCounter();
          if (shouldShowInterstitial()) {
            await showInterstitial();
            resetGameCounter();
          }
          resetGame(mode);
        }}
        onMenu={async () => {
          incrementGameCounter();
          if (shouldShowInterstitial()) {
            await showInterstitial();
            resetGameCounter();
          }
          navigation.navigate('Home');
        }}
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
    marginBottom: 8,
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
  thinkingContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
