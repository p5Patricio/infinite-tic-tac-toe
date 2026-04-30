import {
  signInAnonymously as firebaseSignInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseReady } from './config';
import { UserProfile } from '@/types/game';

function createOfflineUser(): UserProfile {
  return {
    uid: 'offline-user-' + Math.random().toString(36).substr(2, 9),
    displayName: 'Jugador Offline',
    photoURL: null,
    gamesPlayed: 0,
    gamesWon: 0,
    rank: 0,
    createdAt: new Date(),
  };
}

function mapFirebaseUserToProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    gamesPlayed: 0,
    gamesWon: 0,
    rank: 0,
    createdAt: new Date(),
  };
}

export async function signInAnonymously(): Promise<UserProfile> {
  if (!isFirebaseReady || !auth) {
    console.log('[Auth] Firebase offline. Usando usuario mock.');
    return createOfflineUser();
  }
  const result = await firebaseSignInAnonymously(auth);
  return mapFirebaseUserToProfile(result.user);
}

export function getCurrentUser(): UserProfile | null {
  if (!isFirebaseReady || !auth) {
    return createOfflineUser();
  }
  const user = auth.currentUser;
  if (!user) return null;
  return mapFirebaseUserToProfile(user);
}

export function onAuthStateChange(
  callback: (user: UserProfile | null) => void
): () => void {
  if (!isFirebaseReady || !auth) {
    callback(createOfflineUser());
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user ? mapFirebaseUserToProfile(user) : null);
  });
}
