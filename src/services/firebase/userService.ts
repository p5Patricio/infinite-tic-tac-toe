import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './config';
import { UserProfile } from '@/types/game';

const USERS_COLLECTION = 'users';

export async function createUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) return;

  const profile: Omit<UserProfile, 'uid'> = {
    displayName: null,
    photoURL: null,
    gamesPlayed: 0,
    gamesWon: 0,
    rank: 0,
    createdAt: new Date(),
  };

  await setDoc(userRef, profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  return {
    uid,
    ...(snapshot.data() as Omit<UserProfile, 'uid'>),
  };
}

export async function updateStats(
  uid: string,
  won: boolean
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const updates: Record<string, unknown> = {
    gamesPlayed: increment(1),
  };
  if (won) {
    updates.gamesWon = increment(1);
  }
  await updateDoc(userRef, updates);
}
