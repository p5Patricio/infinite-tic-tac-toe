import {
  Player,
  CellValue,
  GameState,
  Move,
} from '@/types/game';
import { BOARD_SIZE, MAX_MARKERS_PER_PLAYER, WINNING_LINES } from '@/constants/game';

export const INITIAL_GAME_STATE: GameState = {
  board: Array(BOARD_SIZE).fill(null),
  movesX: [],
  movesO: [],
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
  totalMoves: 0,
  gameMode: 'local',
  isGameOver: false,
};

export function createInitialState(overrides?: Partial<GameState>): GameState {
  return {
    ...INITIAL_GAME_STATE,
    ...overrides,
  };
}

export function checkWinner(
  board: CellValue[]
): { winner: Player | null; line: number[] | null } {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const value = board[a];
    if (value !== null && value === board[b] && value === board[c]) {
      return { winner: value, line };
    }
  }
  return { winner: null, line: null };
}

export function isBoardFull(board: CellValue[]): boolean {
  return board.every((cell) => cell !== null);
}

export function getValidMoves(state: GameState): number[] {
  if (state.isGameOver) return [];
  const moves: number[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (state.board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

export function makeMove(state: GameState, position: number): GameState {
  // 1. VALIDAR
  if (state.isGameOver) {
    return state;
  }
  if (position < 0 || position >= BOARD_SIZE) {
    return state;
  }
  if (state.board[position] !== null) {
    return state;
  }

  // 2. CREAR MOVIMIENTO
  const move: Move = {
    player: state.currentPlayer,
    position,
    timestamp: Date.now(),
    moveNumber: state.totalMoves + 1,
  };

  // 3. GESTIONAR FIFO DE 3 FICHAS
  const isX = state.currentPlayer === 'X';
  let movesX = [...state.movesX];
  let movesO = [...state.movesO];
  const board = [...state.board];

  if (isX) {
    movesX = [...movesX, move];
    if (movesX.length > MAX_MARKERS_PER_PLAYER) {
      const oldest = movesX.shift()!;
      board[oldest.position] = null;
    }
  } else {
    movesO = [...movesO, move];
    if (movesO.length > MAX_MARKERS_PER_PLAYER) {
      const oldest = movesO.shift()!;
      board[oldest.position] = null;
    }
  }

  // 4. COLOCAR NUEVA MARCA
  board[position] = state.currentPlayer;

  // 5. VERIFICAR WIN CONDITION
  let winner: Player | 'draw' | null = null;
  let winningLine: number[] | null = null;
  let isGameOver = false;

  const winResult = checkWinner(board);
  if (winResult.winner !== null) {
    winner = winResult.winner;
    winningLine = winResult.line;
    isGameOver = true;
  }

  // 6. VERIFICAR EMPATE (guarda de seguridad)
  if (!isGameOver && isBoardFull(board)) {
    winner = 'draw';
    isGameOver = true;
  }

  // 7. CAMBIAR TURNO
  let currentPlayer = state.currentPlayer;
  if (!isGameOver) {
    currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
  }

  // 8. RETORNAR nuevo GameState
  return {
    board,
    movesX,
    movesO,
    currentPlayer,
    winner,
    winningLine,
    totalMoves: state.totalMoves + 1,
    gameMode: state.gameMode,
    isGameOver,
  };
}
