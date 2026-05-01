import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Cell } from './Cell';
import { useGameStore } from '@/store/gameStore';
import { useTheme } from '@/hooks/useTheme';
import { getColors } from '@/constants/theme';

interface BoardProps {
  onCellPress?: (index: number) => void;
}

export function Board({ onCellPress }: BoardProps): React.ReactElement {
  const gameState = useGameStore((s) => s.gameState);
  const makeMove = useGameStore((s) => s.makeMove);
  const theme = useTheme();
  const colors = getColors(theme);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const ghostPosition = useMemo(() => {
    if (gameState.isGameOver) return null;
    const moves =
      gameState.currentPlayer === 'X'
        ? gameState.movesX
        : gameState.movesO;
    if (moves.length === 3) {
      return moves[0].position;
    }
    return null;
  }, [gameState.movesX, gameState.movesO, gameState.currentPlayer, gameState.isGameOver]);

  const winningSet = useMemo(() => {
    if (!gameState.winningLine) return new Set<number>();
    return new Set(gameState.winningLine);
  }, [gameState.winningLine]);

  // Shake board on win
  useEffect(() => {
    if (gameState.isGameOver && gameState.winner && gameState.winner !== 'draw') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    } else {
      shakeAnim.setValue(0);
    }
  }, [gameState.isGameOver, gameState.winner]);

  const handlePress = (index: number) => {
    if (onCellPress) {
      onCellPress(index);
    } else {
      makeMove(index);
    }
  };

  return (
    <Animated.View
      style={[
        styles.board,
        { backgroundColor: colors.surface },
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      <View style={styles.grid}>
        {gameState.board.map((value, index) => (
          <Cell
            key={index}
            value={value}
            onPress={() => handlePress(index)}
            isWinningCell={winningSet.has(index)}
            isGhost={ghostPosition === index && value === null}
            disabled={gameState.isGameOver}
            isGameOver={gameState.isGameOver}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    padding: 12,
    borderRadius: 20,
    alignSelf: 'center',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
