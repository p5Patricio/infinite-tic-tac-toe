import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';

type SettingsNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<SettingsNavProp>();
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const hapticEnabled = useGameStore((s) => s.hapticEnabled);
  const toggleHaptic = useGameStore((s) => s.toggleHaptic);
  const adsRemoved = useGameStore((s) => s.adsRemoved);
  const setAdsRemoved = useGameStore((s) => s.setAdsRemoved);
  const colors = getColors(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ajustes</Text>
        <View style={styles.backButton} />
      </View>

      {/* Settings list */}
      <View style={styles.content}>
        {/* Theme */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            🌙 Tema oscuro
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        {/* Sound */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            🔊 Sonido
          </Text>
          <Switch
            value={soundEnabled}
            onValueChange={toggleSound}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        {/* Haptic */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            📳 Vibración
          </Text>
          <Switch
            value={hapticEnabled}
            onValueChange={toggleHaptic}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        {/* Remove Ads */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              🚫 Quitar publicidad
            </Text>
            <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
              {adsRemoved ? 'Publicidad desactivada' : '$0.99 - Simulación'}
            </Text>
          </View>
          {adsRemoved ? (
            <Text style={[styles.badge, { color: colors.primary }]}>✓ Activo</Text>
          ) : (
            <TouchableOpacity
              onPress={() => setAdsRemoved(true)}
              style={[styles.buyButton, { backgroundColor: colors.buttonBg }]}
            >
              <Text style={[styles.buyButtonText, { color: colors.buttonText }]}>
                Comprar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    fontSize: 14,
    fontWeight: '600',
  },
  buyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
