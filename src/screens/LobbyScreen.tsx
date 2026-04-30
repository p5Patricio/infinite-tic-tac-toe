import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '@/store/gameStore';
import { getColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  findOrCreateMatchmakingRoom,
  createRoom,
  joinRoom,
} from '@/services/firebase/roomService';
import { auth } from '@/services/firebase/config';

type LobbyNavProp = NativeStackNavigationProp<RootStackParamList, 'Lobby'>;

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function LobbyScreen(): React.ReactElement {
  const navigation = useNavigation<LobbyNavProp>();
  const theme = useGameStore((s) => s.theme);
  const isOnlineAvailable = useGameStore((s) => s.isOnlineAvailable);
  const colors = getColors(theme);

  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'waiting_code'>('idle');
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [, setMyPlayer] = useState<'X' | 'O'>('X');

  const userId = auth?.currentUser?.uid ?? 'offline-user';

  const navigateToGame = useCallback(
    (roomId: string, player: 'X' | 'O') => {
      navigation.replace('Game', {
        mode: 'online',
        roomId,
        player,
      });
    },
    [navigation]
  );

  const handleMatchmaking = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }
    setStatus('searching');
    try {
      const roomId = await findOrCreateMatchmakingRoom(userId);
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/services/firebase/config');
      if (!db) throw new Error('Firebase no disponible');
      const snap = await getDoc(doc(db, 'rooms', roomId));
      if (!snap.exists()) throw new Error('Room not found');
      const data = snap.data();
      const player = data.playerXId === userId ? 'X' : 'O';
      setMyPlayer(player);
      setStatus('found');
      navigateToGame(roomId, player);
    } catch (err: any) {
      console.error(err);
      setStatus('idle');
      Alert.alert('Error', err?.message ?? 'No se pudo encontrar partida');
    }
  }, [userId, navigateToGame]);

  const handleCreateRoom = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }
    setStatus('waiting_code');
    try {
      const roomId = await createRoom(userId);
      const shortCode = generateShortCode();
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/services/firebase/config');
      if (!db) throw new Error('Firebase no disponible');
      await updateDoc(doc(db, 'rooms', roomId), { shortCode });
      setRoomCode(shortCode);
      setMyPlayer('X');

      const { onSnapshot } = await import('firebase/firestore');
      const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.playerOId && data.status === 'playing') {
          unsub();
          navigateToGame(roomId, 'X');
        }
      });
    } catch (err: any) {
      console.error(err);
      setStatus('idle');
      Alert.alert('Error', err?.message ?? 'No se pudo crear la sala');
    }
  }, [userId, navigateToGame]);

  const handleJoinRoom = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }
    if (!joinInput.trim()) {
      Alert.alert('Error', 'Ingresa un código de sala');
      return;
    }
    setStatus('searching');
    try {
      const { query, collection, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/services/firebase/config');
      if (!db) throw new Error('Firebase no disponible');
      const q = query(
        collection(db, 'rooms'),
        where('shortCode', '==', joinInput.trim().toUpperCase()),
        where('status', '==', 'waiting')
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setStatus('idle');
        Alert.alert('Error', 'Sala no encontrada o ya está llena');
        return;
      }
      const roomDoc = snap.docs[0];
      const roomId = roomDoc.id;
      await joinRoom(roomId, userId);
      setMyPlayer('O');
      navigateToGame(roomId, 'O');
    } catch (err: any) {
      console.error(err);
      setStatus('idle');
      Alert.alert('Error', err?.message ?? 'No se pudo unir a la sala');
    }
  }, [userId, joinInput, navigateToGame]);

  const handleCancel = useCallback(() => {
    setStatus('idle');
    setRoomCode('');
  }, []);

  // Pantalla de offline
  if (!isOnlineAvailable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Online</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.offlineContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📡</Text>
          <Text style={[styles.offlineTitle, { color: colors.text }]}>
            Multijugador no disponible
          </Text>
          <Text style={[styles.offlineText, { color: colors.textSecondary }]}>
            Configure Firebase en la sección de desarrollo para habilitar partidas online.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backMenuButton, { backgroundColor: colors.buttonBg }]}
          >
            <Text style={[styles.backMenuText, { color: colors.buttonText }]}>
              Volver al menú
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Online</Text>
        <View style={styles.backButton} />
      </View>

      {status === 'searching' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Buscando oponente...
          </Text>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'waiting_code' && roomCode && (
        <View style={styles.centered}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
            Código de sala
          </Text>
          <Text style={[styles.codeText, { color: colors.primary }]}>
            {roomCode}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Comparte este código con tu oponente
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: 24 }}
          />
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'idle' && (
        <View style={styles.content}>
          {/* Matchmaking */}
          <TouchableOpacity
            onPress={handleMatchmaking}
            style={[styles.mainButton, { backgroundColor: colors.buttonBg }]}
          >
            <Text style={[styles.mainButtonText, { color: colors.buttonText }]}>
              🔍 Buscar partida aleatoria
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Crear sala */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sala privada
          </Text>
          <TouchableOpacity
            onPress={handleCreateRoom}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              ➕ Crear sala
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Unirse */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Unirse a sala
          </Text>
          <TextInput
            value={joinInput}
            onChangeText={setJoinInput}
            placeholder="Código de 6 caracteres"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            maxLength={6}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.surface,
              },
            ]}
          />
          <TouchableOpacity
            onPress={handleJoinRoom}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              🔗 Unirse
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  offlineTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  backMenuButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backMenuText: {
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  mainButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  codeText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
    marginTop: 8,
  },
  hint: {
    fontSize: 14,
    marginTop: 12,
  },
});
