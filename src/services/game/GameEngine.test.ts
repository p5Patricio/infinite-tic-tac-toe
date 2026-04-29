import { describe, it, expect } from '@jest/globals';
import {
  createInitialState,
  makeMove,
  checkWinner,
  getValidMoves,
  isBoardFull,
} from './GameEngine';
import { GameState, Player } from '@/types/game';

describe('GameEngine', () => {
  describe('createInitialState', () => {
    it('debe crear estado inicial vacio', () => {
      const state = createInitialState();
      expect(state.board).toEqual(Array(9).fill(null));
      expect(state.movesX).toEqual([]);
      expect(state.movesO).toEqual([]);
      expect(state.currentPlayer).toBe('X');
      expect(state.winner).toBeNull();
      expect(state.winningLine).toBeNull();
      expect(state.totalMoves).toBe(0);
      expect(state.gameMode).toBe('local');
      expect(state.isGameOver).toBe(false);
    });

    it('debe permitir sobreescribir gameMode', () => {
      const state = createInitialState({ gameMode: 'ai' });
      expect(state.gameMode).toBe('ai');
      expect(state.board).toEqual(Array(9).fill(null));
    });
  });

  describe('makeMove', () => {
    it('debe colocar X en posicion 0', () => {
      const state = createInitialState();
      const newState = makeMove(state, 0);
      expect(newState.board[0]).toBe('X');
      expect(newState.movesX).toHaveLength(1);
      expect(newState.movesX[0].position).toBe(0);
      expect(newState.movesX[0].player).toBe('X');
      expect(newState.totalMoves).toBe(1);
    });

    it('debe alternar turnos X -> O', () => {
      const state = createInitialState();
      const afterX = makeMove(state, 0);
      expect(afterX.currentPlayer).toBe('O');
      const afterO = makeMove(afterX, 1);
      expect(afterO.currentPlayer).toBe('X');
    });

    it('debe detectar victoria horizontal superior', () => {
      // X en 0, O en 3, X en 1, O en 4, X en 2 -> X gana [0,1,2]
      let state = createInitialState();
      state = makeMove(state, 0); // X
      state = makeMove(state, 3); // O
      state = makeMove(state, 1); // X
      state = makeMove(state, 4); // O
      state = makeMove(state, 2); // X

      expect(state.winner).toBe('X');
      expect(state.winningLine).toEqual([0, 1, 2]);
      expect(state.isGameOver).toBe(true);
    });

    it('debe eliminar la ficha mas antigua al colocar la 4', () => {
      // X juega en 8 (extra), 1, 2, y luego 0
      // La ficha en 8 debe desaparecer al colocar la 4
      let state = createInitialState();
      state = makeMove(state, 8); // X en 8
      state = makeMove(state, 4); // O en 4
      state = makeMove(state, 1); // X en 1
      state = makeMove(state, 5); // O en 5
      state = makeMove(state, 2); // X en 2
      state = makeMove(state, 6); // O en 6

      // Ahora X tiene 3 fichas: 8, 1, 2
      expect(state.movesX).toHaveLength(3);
      expect(state.board[8]).toBe('X');

      // X juega la 4ª ficha en 0
      state = makeMove(state, 0); // X en 0

      // La ficha mas antigua (posicion 8) debe desaparecer
      expect(state.movesX).toHaveLength(3);
      expect(state.board[8]).toBeNull();
      expect(state.board[0]).toBe('X');
      expect(state.board[1]).toBe('X');
      expect(state.board[2]).toBe('X');
    });

    it('debe declarar ganador si O completa 3 en linea tras desaparicion de X', () => {
      // Escenario: O juega diagonal [0,4,8].
      // O tiene ficha extra en 5, luego 0, luego 4.
      // X juega 1, 2, 6, 3 (la ficha 1 desaparece).
      // O juega 8 como su 4ª ficha. La extra (5) desaparece.
      // O queda con [0,4,8] -> diagonal ganadora.
      let state = createInitialState();
      state = makeMove(state, 1); // X1
      state = makeMove(state, 5); // O5 (extra)
      state = makeMove(state, 2); // X2
      state = makeMove(state, 0); // O0
      state = makeMove(state, 6); // X6
      state = makeMove(state, 4); // O4 -> O tiene [5,0,4]
      state = makeMove(state, 3); // X3 -> X=[1,2,6,3], 1 desaparece. X=[2,6,3]
      state = makeMove(state, 8); // O8 -> O=[5,0,4,8], 5 desaparece. O=[0,4,8]

      expect(state.winner).toBe('O');
      expect(state.winningLine).toEqual([0, 4, 8]);
      expect(state.isGameOver).toBe(true);
    });

    it('debe rechazar movimiento en celda ocupada', () => {
      let state = createInitialState();
      state = makeMove(state, 0); // X en 0
      const beforeReject = state;
      state = makeMove(state, 0); // Intentar X en 0 otra vez
      expect(state).toEqual(beforeReject);
      expect(state.totalMoves).toBe(1);
    });

    it('no debe permitir movimiento si isGameOver=true', () => {
      // Crear un estado ganado manualmente
      const finishedState: GameState = {
        ...createInitialState(),
        board: ['X', 'X', 'X', null, 'O', null, null, 'O', null],
        currentPlayer: 'O',
        winner: 'X',
        winningLine: [0, 1, 2],
        totalMoves: 5,
        isGameOver: true,
      };
      const afterMove = makeMove(finishedState, 3);
      expect(afterMove).toEqual(finishedState);
    });

    it('debe manejar desaparicion correcta cuando ambos jugadores tienen 3 fichas', () => {
      // Escenario: ambos jugadores tienen 3 fichas cada uno
      // X: 0, 8, 1 (al jugar la 4, la 0 desaparece)
      // O: 3, 6, 4 (al jugar la 4, la 3 desaparece)
      // Cuidado: ninguna combinacion forma linea ganadora antes de tiempo.

      let state = createInitialState();
      state = makeMove(state, 0); // X0
      state = makeMove(state, 3); // O3
      state = makeMove(state, 8); // X8
      state = makeMove(state, 6); // O6
      state = makeMove(state, 1); // X1 -> X tiene 0,8,1
      state = makeMove(state, 4); // O4 -> O tiene 3,6,4

      // X juega 2 -> 0 desaparece
      state = makeMove(state, 2); // X2 -> X tiene 8,1,2
      expect(state.board[0]).toBeNull();
      expect(state.movesX).toHaveLength(3);
      expect(state.movesX.map((m) => m.position)).toEqual([8, 1, 2]);

      // O juega 5 -> 3 desaparece
      state = makeMove(state, 5); // O5 -> O tiene 6,4,5
      expect(state.board[3]).toBeNull();
      expect(state.movesO).toHaveLength(3);
      expect(state.movesO.map((m) => m.position)).toEqual([6, 4, 5]);

      // Verificar que el tablero refleja correctamente las fichas restantes
      expect(state.board[8]).toBe('X');
      expect(state.board[1]).toBe('X');
      expect(state.board[2]).toBe('X');
      expect(state.board[6]).toBe('O');
      expect(state.board[4]).toBe('O');
      expect(state.board[5]).toBe('O');
    });
  });

  describe('checkWinner', () => {
    it('debe retornar null cuando no hay ganador', () => {
      const board = Array(9).fill(null);
      const result = checkWinner(board);
      expect(result.winner).toBeNull();
      expect(result.line).toBeNull();
    });

    it('debe detectar ganador en diagonal', () => {
      const board: (Player | null)[] = ['X', null, null, null, 'X', null, null, null, 'X'];
      const result = checkWinner(board);
      expect(result.winner).toBe('X');
      expect(result.line).toEqual([0, 4, 8]);
    });
  });

  describe('getValidMoves', () => {
    it('debe retornar todas las celdas vacias', () => {
      const state = createInitialState();
      const moves = getValidMoves(state);
      expect(moves).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('debe retornar array vacio cuando juego termino', () => {
      const state = createInitialState({ isGameOver: true });
      expect(getValidMoves(state)).toEqual([]);
    });
  });

  describe('isBoardFull', () => {
    it('debe retornar false para tablero vacio', () => {
      expect(isBoardFull(Array(9).fill(null))).toBe(false);
    });

    it('debe retornar true para tablero lleno', () => {
      expect(isBoardFull(Array(9).fill('X'))).toBe(true);
    });
  });
});
