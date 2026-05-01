import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { useTheme } from '@/hooks/useTheme';
import { getColors } from '@/constants/theme';
import { Move } from '@/types/game';

function OldestDot({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}): React.ReactElement {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.dotContainer,
        { borderColor: color, borderWidth: 2, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function PlayerIndicator(): React.ReactElement {
  const gameState = useGameStore((s) => s.gameState);
  const theme = useTheme();
  const colors = getColors(theme);

  const renderMoveDots = (moves: Move[], player: 'X' | 'O') => {
    const color = player === 'X' ? colors.playerX : colors.playerO;
    return (
      <View style={styles.dotsRow}>
        {[1, 2, 3].map((num) => {
          const move = moves[num - 1];
          const isOldest = num === 1 && moves.length === 3;
          const dotContent = move ? (
            <Text style={[styles.dotText, { color }]}>{num}</Text>
          ) : (
            <View style={[styles.emptyDot, { borderColor: color }]} />
          );

          if (isOldest) {
            return (
              <OldestDot key={num} color={color}>
                {dotContent}
              </OldestDot>
            );
          }

          return (
            <View key={num} style={styles.dotContainer}>
              {dotContent}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.playerRow,
          gameState.currentPlayer === 'X' && {
            backgroundColor: colors.surfaceHighlight,
          },
        ]}
      >
        <Text style={[styles.playerLabel, { color: colors.playerX }]}>X</Text>
        {renderMoveDots(gameState.movesX, 'X')}
      </View>
      <View
        style={[
          styles.playerRow,
          gameState.currentPlayer === 'O' && {
            backgroundColor: colors.surfaceHighlight,
          },
        ]}
      >
        <Text style={[styles.playerLabel, { color: colors.playerO }]}>O</Text>
        {renderMoveDots(gameState.movesO, 'O')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    marginTop: 16,
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  playerLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dotContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dotText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
