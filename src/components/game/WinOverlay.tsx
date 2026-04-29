import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';

interface WinOverlayProps {
  onPlayAgain: () => void;
  onMenu: () => void;
}

export function WinOverlay({
  onPlayAgain,
  onMenu,
}: WinOverlayProps): React.ReactElement | null {
  const gameState = useGameStore((s) => s.gameState);
  const theme = useGameStore((s) => s.theme);
  const colors = getColors(theme);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (gameState.isGameOver && gameState.winner && gameState.winner !== 'draw') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [gameState.isGameOver, gameState.winner]);

  if (!gameState.isGameOver || !gameState.winner || gameState.winner === 'draw') {
    return null;
  }

  const winnerText = gameState.winner === 'X' ? '¡X Gana!' : '¡O Gana!';
  const winnerColor =
    gameState.winner === 'X' ? colors.playerX : colors.playerO;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View
        style={[
          styles.content,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.title, { color: winnerColor }]}>
          {winnerText}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onPlayAgain}
            style={[styles.button, { backgroundColor: colors.buttonBg }]}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              Jugar de nuevo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMenu}
            style={[
              styles.button,
              styles.secondaryButton,
              { borderColor: colors.border },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Menú principal
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    width: '80%',
    maxWidth: 320,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
