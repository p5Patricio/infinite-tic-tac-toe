import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Cell } from './Cell';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';

export function Board(): React.ReactElement {
  const gameState = useGameStore((s) => s.gameState);
  const makeMove = useGameStore((s) => s.makeMove);
  const theme = useGameStore((s) => s.theme);
  const colors = getColors(theme);

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

  return (
    <View style={[styles.board, { backgroundColor: colors.surface }]}
    >
      <View style={styles.grid}>
        {gameState.board.map((value, index) => (
          <Cell
            key={index}
            value={value}
            onPress={() => makeMove(index)}
            isWinningCell={winningSet.has(index)}
            isGhost={ghostPosition === index && value === null}
            disabled={gameState.isGameOver}
          />
        ))}
      </View>
    </View>
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
