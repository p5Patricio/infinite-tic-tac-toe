import {
  signInAnonymously as firebaseSignInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './config';
import { UserProfile } from '@/types/game';

export async function signInAnonymously(): Promise<UserProfile> {
  const result = await firebaseSignInAnonymously(auth);
  const user = result.user;
  return mapFirebaseUserToProfile(user);
}

export function getCurrentUser(): UserProfile | null {
  const user = auth.currentUser;
  if (!user) return null;
  return mapFirebaseUserToProfile(user);
}

export function onAuthStateChange(
  callback: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? mapFirebaseUserToProfile(user) : null);
  });
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
