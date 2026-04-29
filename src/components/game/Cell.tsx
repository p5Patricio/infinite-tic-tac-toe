import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { CellValue } from '@/types/game';
import { getColors } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

interface CellProps {
  value: CellValue;
  onPress: () => void;
  isWinningCell: boolean;
  isGhost: boolean;
  disabled?: boolean;
}

export function Cell({
  value,
  onPress,
  isWinningCell,
  isGhost,
  disabled = false,
}: CellProps): React.ReactElement {
  const theme = useGameStore((s) => s.theme);
  const colors = getColors(theme);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value !== null) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: isGhost ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [value, isGhost]);

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
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
          winningStyle,
          isGhost && styles.ghostCell,
        ]}
      >
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
  },
  ghostCell: {
    borderStyle: 'dashed',
  },
});
