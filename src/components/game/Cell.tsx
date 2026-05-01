import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { CellValue } from '@/types/game';
import { getColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CellProps {
  value: CellValue;
  onPress: () => void;
  isWinningCell: boolean;
  isGhost: boolean;
  disabled?: boolean;
  isGameOver?: boolean;
}

export function Cell({
  value,
  onPress,
  isWinningCell,
  isGhost,
  disabled = false,
  isGameOver = false,
}: CellProps): React.ReactElement {
  const theme = useTheme();
  const colors = getColors(theme);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const ghostBlinkAnim = useRef(new Animated.Value(0.4)).current;
  const winPulseAnim = useRef(new Animated.Value(1)).current;
  const prevValue = useRef<CellValue>(value);
  const ghostLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Detectar cambios de valor: appear / disappear
  useEffect(() => {
    const prev = prevValue.current;
    prevValue.current = value;

    if (prev !== null && value === null) {
      // DESAPARICIÓN: fade-out + scale down
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        scaleAnim.setValue(1);
      });
    } else if (prev === null && value !== null) {
      // APARICIÓN: scale up + fade in
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (value === null && !isGhost) {
      // Celda vacía (no ghost): asegurar opacidad 0
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [value, isGhost]);

  // Ghost blink animation
  useEffect(() => {
    if (value === null && isGhost) {
      ghostBlinkAnim.setValue(0.4);
      ghostLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(ghostBlinkAnim, {
            toValue: 0.8,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(ghostBlinkAnim, {
            toValue: 0.4,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      ghostLoopRef.current.start();
    } else {
      ghostLoopRef.current?.stop();
      ghostBlinkAnim.setValue(0.4);
    }
    return () => {
      ghostLoopRef.current?.stop();
    };
  }, [isGhost, value]);

  // Winning cell pulse
  useEffect(() => {
    if (isWinningCell && isGameOver && value !== null) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(winPulseAnim, {
            toValue: 0.6,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(winPulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      winPulseAnim.setValue(1);
    }
  }, [isWinningCell, isGameOver, value]);

  const isEmpty = value === null && !isGhost;
  const cellColor = isGhost
    ? colors.ghostX
    : value === 'X'
    ? colors.playerX
    : value === 'O'
    ? colors.playerO
    : colors.border;

  const winningStyle = isWinningCell
    ? { backgroundColor: colors.winning + '30', borderColor: colors.winning }
    : {};

  const animatedOpacity =
    isGhost && value === null ? ghostBlinkAnim : opacityAnim;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !isEmpty}
      activeOpacity={0.7}
      style={styles.touchable}
    >
      <Animated.View
        style={[
          styles.cell,
          {
            borderColor: cellColor,
            opacity: animatedOpacity,
            transform: [{ scale: scaleAnim }],
          },
          winningStyle,
          isGhost && styles.ghostCell,
        ]}
      >
        {isWinningCell && isGameOver && value !== null && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.winning,
                opacity: winPulseAnim,
                borderRadius: 12,
              },
            ]}
          />
        )}

        {value === 'X' && (
          <Svg width={48} height={48} viewBox="0 0 48 48">
            <Line
              x1="12"
              y1="12"
              x2="36"
              y2="36"
              stroke={colors.playerX}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Line
              x1="36"
              y1="12"
              x2="12"
              y2="36"
              stroke={colors.playerX}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </Svg>
        )}
        {value === 'O' && (
          <Svg width={48} height={48} viewBox="0 0 48 48">
            <Circle
              cx="24"
              cy="24"
              r="14"
              stroke={colors.playerO}
              strokeWidth="4"
              fill="none"
            />
          </Svg>
        )}
        {isGhost && value === null && (
          <Svg width={48} height={48} viewBox="0 0 48 48">
            <Circle
              cx="24"
              cy="24"
              r="14"
              stroke={colors.ghostO}
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
          </Svg>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 6,
  },
  cell: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  ghostCell: {
    borderStyle: 'dashed',
  },
});
