import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { AIDifficulty } from '@/types/game';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const setAIDifficulty = useGameStore((s) => s.setAIDifficulty);
  const colors = getColors(theme);

  const [showDifficultyModal, setShowDifficultyModal] = useState(false);

  const handleSelectDifficulty = (difficulty: AIDifficulty) => {
    setAIDifficulty(difficulty);
    setShowDifficultyModal(false);
    navigation.navigate('Game', { mode: 'ai' });
  };

  const handleModePress = (mode: 'local' | 'ai' | 'zen' | 'online', isLobby?: boolean) => {
    if (mode === 'ai') {
      setShowDifficultyModal(true);
      return;
    }
    if (isLobby) {
      navigation.navigate('Lobby');
    } else {
      navigation.navigate('Game', { mode });
    }
  };

  const modes: { label: string; mode: 'local' | 'ai' | 'zen' | 'online'; isLobby?: boolean }[] = [
    { label: '2 Jugadores (Local)', mode: 'local' },
    { label: 'Vs IA', mode: 'ai' },
    { label: 'Online', mode: 'online', isLobby: true },
    { label: 'Modo Zen', mode: 'zen' },
  ];

  const difficulties: { label: string; value: AIDifficulty; color: string }[] = [
    { label: 'Fácil', value: 'easy', color: '#4CD964' },
    { label: 'Medio', value: 'medium', color: '#FF9500' },
    { label: 'Difícil', value: 'hard', color: '#FF3B30' },
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
          onPress={() => navigation.navigate('Settings')}
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
        {modes.map(({ label, mode, isLobby }) => (
          <TouchableOpacity
            key={mode + label}
            onPress={() => handleModePress(mode, isLobby)}
            activeOpacity={0.7}
            style={[
              styles.modeButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              styles.modeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: colors.text },
              ]}
            >
              {label}
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

      {/* Difficulty Modal */}
      <Modal
        visible={showDifficultyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Selecciona dificultad
            </Text>
            <View style={styles.difficultyButtons}>
              {difficulties.map(({ label, value, color }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleSelectDifficulty(value)}
                  style={[styles.diffButton, { backgroundColor: color }]}
                >
                  <Text style={styles.diffButtonText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowDifficultyModal(false)}
              style={styles.cancelButton}
            >
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  difficultyButtons: {
    width: '100%',
    gap: 12,
  },
  diffButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  diffButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 10,
  },
});
