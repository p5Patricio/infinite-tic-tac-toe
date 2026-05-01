import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { AnalyticsManager } from '@/services/analytics/AnalyticsManager';

const pkg = require('../../package.json');

type SettingsNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<SettingsNavProp>();
  const theme = useGameStore((s) => s.theme);
  const setTheme = useGameStore((s) => s.setTheme);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const hapticEnabled = useGameStore((s) => s.hapticEnabled);
  const toggleHaptic = useGameStore((s) => s.toggleHaptic);
  const adsRemoved = useGameStore((s) => s.adsRemoved);
  const setAdsRemoved = useGameStore((s) => s.setAdsRemoved);
  const resetStatsAsync = useGameStore((s) => s.resetStatsAsync);
  const resolvedTheme = useTheme();
  const colors = getColors(resolvedTheme);

  const handleToggleSound = (value: boolean) => {
    toggleSound();
    AnalyticsManager.logSettingsChanged('sound', value);
  };

  const handleToggleHaptic = (value: boolean) => {
    toggleHaptic();
    AnalyticsManager.logSettingsChanged('haptic', value);
  };

  const handleSetTheme = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    AnalyticsManager.logSettingsChanged('theme', value);
  };

  const handleResetStats = () => {
    Alert.alert(
      'Restablecer estadísticas',
      '¿Estás seguro? Se borrarán todas tus estadísticas locales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            resetStatsAsync().catch(() => {});
          },
        },
      ]
    );
  };

  const themeOptions: Array<{
    label: string;
    value: 'light' | 'dark' | 'system';
  }> = [
    { label: '☀️ Claro', value: 'light' },
    { label: '🌙 Oscuro', value: 'dark' },
    { label: '📱 Sistema', value: 'system' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={resolvedTheme === 'light' ? 'dark' : 'light'} />

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
        {/* Theme selector */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>🎨 Tema</Text>
          <View style={styles.themeSelector}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleSetTheme(opt.value)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      theme === opt.value ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        theme === opt.value ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sound */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>🔊 Sonido</Text>
          <Switch
            value={soundEnabled}
            onValueChange={handleToggleSound}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        {/* Haptic */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>📳 Vibración</Text>
          <Switch
            value={hapticEnabled}
            onValueChange={handleToggleHaptic}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        {/* Remove Ads */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>🚫 Quitar publicidad</Text>
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
              <Text style={[styles.buyButtonText, { color: colors.buttonText }]}>Comprar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reset Stats */}
        <TouchableOpacity
          onPress={handleResetStats}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>🗑️ Restablecer estadísticas</Text>
          <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Borrar datos locales</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionRow}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Versión {pkg.version}
          </Text>
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
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  versionRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
  },
});
