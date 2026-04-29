import { GameState, AIDifficulty, Player, CellValue } from '@/types/game';
import { makeMove, getValidMoves } from './GameEngine';
import { WINNING_LINES } from '@/constants/game';

const SCORE_WIN = 1000;
const SCORE_LOSE = -1000;
const SCORE_TWO_IN_LINE = 10;
const SCORE_BLOCK_TWO = -20;
const SCORE_CENTER = 5;
const MAX_DEPTH_HARD = 6;
const MAX_DEPTH_MEDIUM = 4;
const MAX_DEPTH_EASY = 2;

// Cache de estados evaluados: key -> score
const evalCache = new Map<string, number>();

function serializeState(state: GameState): string {
  const boardStr = state.board.map((c) => c ?? '-').join('');
  const movesXStr = state.movesX.map((m) => m.position).join(',');
  const movesOStr = state.movesO.map((m) => m.position).join(',');
  return `${boardStr}|${state.currentPlayer}|${movesXStr}|${movesOStr}`;
}

function evaluateBoard(state: GameState, aiPlayer: Player): number {
  const cacheKey = serializeState(state);
  if (evalCache.has(cacheKey)) {
    return evalCache.get(cacheKey)!;
  }

  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';
  let score = 0;

  // Verificar ganador inmediato
  if (state.winner === aiPlayer) {
    evalCache.set(cacheKey, SCORE_WIN);
    return SCORE_WIN;
  }
  if (state.winner === opponent) {
    evalCache.set(cacheKey, SCORE_LOSE);
    return SCORE_LOSE;
  }
  if (state.winner === 'draw') {
    evalCache.set(cacheKey, 0);
    return 0;
  }

  // Heurística por líneas
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const cells: CellValue[] = [state.board[a], state.board[b], state.board[c]];

    const aiCount = cells.filter((cell) => cell === aiPlayer).length;
    const oppCount = cells.filter((cell) => cell === opponent).length;
    const emptyCount = cells.filter((cell) => cell === null).length;

    if (aiCount === 2 && emptyCount === 1) {
      score += SCORE_TWO_IN_LINE;
    } else if (oppCount === 2 && emptyCount === 1) {
      score += SCORE_BLOCK_TWO;
    } else if (aiCount === 3) {
      score += SCORE_WIN;
    } else if (oppCount === 3) {
      score += SCORE_LOSE;
    }
  }

  // Bonus por centro
  if (state.board[4] === aiPlayer) {
    score += SCORE_CENTER;
  }

  evalCache.set(cacheKey, score);
  return score;
}

function minimax(
  state: GameState,
  depth: number,
  maxDepth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  alpha: number,
  beta: number
): number {
  // Terminal: ganador, empate, o profundidad máxima
  if (state.isGameOver || depth >= maxDepth) {
    return evaluateBoard(state, aiPlayer);
  }

  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) {
    return evaluateBoard(state, aiPlayer);
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of validMoves) {
      const newState = makeMove(state, move);
      const score = minimax(newState, depth + 1, maxDepth, false, aiPlayer, alpha, beta);
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Poda alpha-beta
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of validMoves) {
      const newState = makeMove(state, move);
      const score = minimax(newState, depth + 1, maxDepth, true, aiPlayer, alpha, beta);
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Poda alpha-beta
    }
    return bestScore;
  }
}

function getBestMove(state: GameState, maxDepth: number, aiPlayer: Player): number {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return -1;

  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  for (const move of validMoves) {
    const newState = makeMove(state, move);
    const score = minimax(newState, 0, maxDepth, false, aiPlayer, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getRandomMove(state: GameState): number {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return -1;
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

/**
 * Obtiene el mejor movimiento para la IA según la dificultad.
 * La IA siempre juega como el jugador que NO es el currentPlayer del estado inicial,
 * pero en la práctica asumimos que el humano es 'X' y la IA es 'O'.
 */
export function getAIMove(
  state: GameState,
  difficulty: AIDifficulty
): number {
  // Determinar qué jugador es la IA
  // En modo AI, el humano siempre empieza como X, la IA es O
  const aiPlayer: Player = 'O';

  const rand = Math.random();

  switch (difficulty) {
    case 'easy':
      if (rand < 0.6) {
        return getRandomMove(state);
      }
      return getBestMove(state, MAX_DEPTH_EASY, aiPlayer);

    case 'medium':
      if (rand < 0.3) {
        return getRandomMove(state);
      }
      return getBestMove(state, MAX_DEPTH_MEDIUM, aiPlayer);

    case 'hard':
      return getBestMove(state, MAX_DEPTH_HARD, aiPlayer);

    default:
      return getRandomMove(state);
  }
}

export function clearAICache(): void {
  evalCache.clear();
}
