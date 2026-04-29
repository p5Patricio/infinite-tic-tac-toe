import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db } from './config';
import { GameState, OnlineRoom } from '@/types/game';
import { createInitialState } from '@/services/game/GameEngine';

const ROOMS_COLLECTION = 'rooms';

function toOnlineRoom(docId: string, data: unknown): OnlineRoom {
  const d = data as Record<string, unknown>;
  return {
    id: docId,
    playerXId: (d.playerXId as string | null) ?? null,
    playerOId: (d.playerOId as string | null) ?? null,
    gameState: (d.gameState as GameState) ?? createInitialState(),
    status: (d.status as 'waiting' | 'playing' | 'finished') ?? 'waiting',
    createdAt: (d.createdAt as Timestamp) ?? Timestamp.now(),
    lastMoveAt: (d.lastMoveAt as Timestamp) ?? Timestamp.now(),
  };
}

export async function createRoom(userId: string): Promise<string> {
  const roomRef = doc(collection(db, ROOMS_COLLECTION));
  const initialState = createInitialState({ gameMode: 'online' });

  await setDoc(roomRef, {
    playerXId: userId,
    playerOId: null,
    gameState: initialState,
    status: 'waiting',
    createdAt: serverTimestamp(),
    lastMoveAt: serverTimestamp(),
    lastSeenAtX: serverTimestamp(),
    lastSeenAtO: null,
  });

  return roomRef.id;
}

export async function joinRoom(
  roomId: string,
  userId: string
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snapshot = await getDoc(roomRef);

  if (!snapshot.exists()) {
    throw new Error('Room not found');
  }

  const data = snapshot.data();
  if (data.playerXId === userId) {
    return;
  }
  if (data.playerOId && data.playerOId !== userId) {
    throw new Error('Room is full');
  }

  await updateDoc(roomRef, {
    playerOId: userId,
    status: 'playing',
    lastMoveAt: serverTimestamp(),
    lastSeenAtO: serverTimestamp(),
  });
}

export function listenToRoom(
  roomId: string,
  callback: (room: OnlineRoom) => void
): Unsubscribe {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const room = toOnlineRoom(snapshot.id, snapshot.data());
    callback(room);
  });
}

export async function updateGameState(
  roomId: string,
  gameState: GameState
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    gameState,
    lastMoveAt: serverTimestamp(),
  });
}

export async function findOrCreateMatchmakingRoom(
  userId: string
): Promise<string> {
  const roomsRef = collection(db, ROOMS_COLLECTION);
  const q = query(
    roomsRef,
    where('status', '==', 'waiting'),
    where('playerXId', '!=', userId)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // Usar transaccion para evitar race conditions
    for (const docSnap of snapshot.docs) {
      const roomRef = docSnap.ref;
      try {
        await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw new Error('Room no longer exists');
          const data = roomDoc.data();
          if (data.status !== 'waiting' || data.playerOId != null) {
            throw new Error('Room no longer available');
          }
          transaction.update(roomRef, {
            playerOId: userId,
            status: 'playing',
            lastMoveAt: serverTimestamp(),
            lastSeenAtO: serverTimestamp(),
          });
        });
        return roomRef.id;
      } catch {
        // Intentar siguiente sala
        continue;
      }
    }
  }

  return createRoom(userId);
}

export async function sendHeartbeat(
  roomId: string,
  player: 'X' | 'O'
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const field = player === 'X' ? 'lastSeenAtX' : 'lastSeenAtO';
  await updateDoc(roomRef, {
    [field]: serverTimestamp(),
  });
}

export function getOpponentLastSeen(
  roomData: Record<string, unknown>,
  myPlayer: 'X' | 'O'
): Timestamp | null {
  const field = myPlayer === 'X' ? 'lastSeenAtO' : 'lastSeenAtX';
  const value = roomData[field];
  return value instanceof Timestamp ? value : null;
}
