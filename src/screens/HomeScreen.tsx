import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const colors = getColors(theme);

  const modes: { label: string; mode: 'local' | 'ai' | 'zen' | 'online'; disabled?: boolean; isLobby?: boolean }[] = [
    { label: '2 Jugadores (Local)', mode: 'local' },
    { label: 'Vs IA', mode: 'ai' },
    { label: 'Online', mode: 'online', isLobby: true },
    { label: 'Modo Zen', mode: 'zen' },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Settings / Theme toggle */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconButton, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {}}
          style={[styles.iconButton, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Infinite
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tic Tac Toe
        </Text>
      </View>

      {/* Mode buttons */}
      <View style={styles.buttonsContainer}>
        {modes.map(({ label, mode, disabled, isLobby }) => (
          <TouchableOpacity
            key={mode + label}
            onPress={() => {
              if (!disabled) {
                if (isLobby) {
                  navigation.navigate('Lobby');
                } else {
                  navigation.navigate('Game', { mode });
                }
              }
            }}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.7}
            style={[
              styles.modeButton,
              {
                backgroundColor: disabled
                  ? colors.disabled
                  : colors.surface,
                borderColor: colors.border,
              },
              !disabled && styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,
                {
                  color: disabled ? colors.textSecondary : colors.text,
                },
              ]}
            >
              {label}
              {disabled && ' (Próximamente)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Sin empates. Sin límites.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: 4,
    marginTop: -8,
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    gap: 14,
  },
  modeButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});
