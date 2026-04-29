export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type GameMode = 'local' | 'online' | 'ai' | 'zen';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Move {
  player: Player;
  position: number;
  timestamp: number;
  moveNumber: number;
}

export interface GameState {
  board: CellValue[];
  movesX: Move[];
  movesO: Move[];
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  winningLine: number[] | null;
  totalMoves: number;
  gameMode: GameMode;
  isGameOver: boolean;
}

export type FirebaseTimestamp = { seconds: number; nanoseconds: number } | Date;

export interface OnlineRoom {
  id: string;
  playerXId: string | null;
  playerOId: string | null;
  gameState: GameState;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: FirebaseTimestamp;
  lastMoveAt: FirebaseTimestamp;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  gamesPlayed: number;
  gamesWon: number;
  rank: number;
  createdAt: FirebaseTimestamp;
}
