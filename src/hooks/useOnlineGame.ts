import { useEffect, useRef, useState, useCallback } from 'react';
import { listenToRoom, updateGameState, sendHeartbeat } from '@/services/firebase/roomService';
import { useGameStore } from '@/store/gameStore';

import { Timestamp } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

const HEARTBEAT_INTERVAL_MS = 10000;
const DISCONNECT_THRESHOLD_MS = 30000;

interface UseOnlineGameResult {
  isConnected: boolean;
  opponentDisconnected: boolean;
  isSearching: boolean;
  rematchRequested: boolean;
}

export function useOnlineGame(
  roomId: string | undefined,
  myPlayer: 'X' | 'O' | undefined
): UseOnlineGameResult {
  const [isConnected, setIsConnected] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [rematchRequested] = useState(false);

  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useCallback(
    (gs: typeof gameState) => {
      useGameStore.setState({ gameState: gs });
    },
    []
  );

  const lastLocalMoveCount = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectCheckRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!roomId || !myPlayer) return;

    setIsSearching(true);

    // Escuchar cambios de la sala
    unsubscribeRef.current = listenToRoom(roomId, (room) => {
      setIsSearching(false);

      const remoteGameState = room.gameState;
      if (!remoteGameState) return;

      // Evitar loop: solo actualizar si el movimiento es del oponente
      // Detectamos esto comparando totalMoves o si currentPlayer cambió al nuestro
      const localTotal = lastLocalMoveCount.current;
      const remoteTotal = remoteGameState.totalMoves;

      if (remoteTotal > localTotal) {
        // Movimiento del oponente recibido
        lastLocalMoveCount.current = remoteTotal;
        setGameState(remoteGameState);
      } else if (remoteTotal < localTotal) {
        // Estado remoto está desfasado (raro), sincronizar hacia arriba
        lastLocalMoveCount.current = remoteTotal;
        setGameState(remoteGameState);
      }

      setIsConnected(true);

      // Verificar desconexión del oponente
      const opponentId = myPlayer === 'X' ? room.playerOId : room.playerXId;
      if (!opponentId) {
        setOpponentDisconnected(false);
        return;
      }

      const roomData = room as unknown as Record<string, unknown>;
      const lastSeenField = myPlayer === 'X' ? 'lastSeenAtO' : 'lastSeenAtX';
      const lastSeenRaw = roomData[lastSeenField];

      if (lastSeenRaw instanceof Timestamp) {
        const lastSeenMs = lastSeenRaw.toMillis();
        const nowMs = Date.now();
        const diff = nowMs - lastSeenMs;
        setOpponentDisconnected(diff > DISCONNECT_THRESHOLD_MS);
      } else {
        setOpponentDisconnected(false);
      }
    });

    // Heartbeat cada 10 segundos
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(roomId, myPlayer).catch(() => {
        // Silenciar errores de heartbeat
      });
    }, HEARTBEAT_INTERVAL_MS);

    // Enviar heartbeat inmediato al conectar
    sendHeartbeat(roomId, myPlayer).catch(() => {});

    // Check de desconexión periódico
    disconnectCheckRef.current = setInterval(() => {
      // El listener de onSnapshot ya actualiza opponentDisconnected
      // Este interval es respaldo adicional si Firestore se retrasa
    }, 5000);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (disconnectCheckRef.current) {
        clearInterval(disconnectCheckRef.current);
        disconnectCheckRef.current = null;
      }
    };
  }, [roomId, myPlayer, setGameState]);

  // Sincronizar movimientos locales a Firestore
  useEffect(() => {
    if (!roomId || !myPlayer) return;

    const currentTotal = gameState.totalMoves;
    if (currentTotal > lastLocalMoveCount.current) {
      // El jugador local hizo un movimiento
      lastLocalMoveCount.current = currentTotal;
      updateGameState(roomId, gameState).catch((err) => {
        console.error('Failed to sync game state:', err);
      });
    }
  }, [gameState, roomId, myPlayer]);

  return {
    isConnected,
    opponentDisconnected,
    isSearching,
    rematchRequested,
  };
}
