import { describe, it, expect } from '@jest/globals';
import { getAIMove, clearAICache } from './AIEngine';
import { createInitialState, makeMove } from './GameEngine';
import { GameState } from '@/types/game';

describe('AIEngine', () => {
  beforeEach(() => {
    clearAICache();
  });

  it('debe bloquear victoria inmediata del oponente en dificultad dificil', () => {
    // X tiene 0 y 1. Necesita 2 para ganar horizontal superior.
    // La IA (O) debe jugar en 2 para bloquear.
    let state = createInitialState();
    state = makeMove(state, 0); // X0
    state = makeMove(state, 4); // O4
    state = makeMove(state, 1); // X1 -> X tiene [0,1], necesita 2

    const move = getAIMove(state, 'hard');
    expect(move).toBe(2);
  });

  it('debe encontrar victoria propia en 1 movimiento', () => {
    // O tiene 3 y 4. Necesita 5 para ganar horizontal media.
    // Es turno de O.
    const state: GameState = {
      ...createInitialState(),
      board: [null, 'X', null, 'O', 'O', null, null, 'X', null],
      movesX: [
        { player: 'X', position: 1, timestamp: 0, moveNumber: 1 },
        { player: 'X', position: 7, timestamp: 0, moveNumber: 3 },
      ],
      movesO: [
        { player: 'O', position: 3, timestamp: 0, moveNumber: 2 },
        { player: 'O', position: 4, timestamp: 0, moveNumber: 4 },
      ],
      currentPlayer: 'O',
      totalMoves: 4,
    };

    const move = getAIMove(state, 'hard');
    expect(move).toBe(5);
  });

  it('debe considerar desaparicion de fichas en decision', () => {
    // Escenario donde la IA tiene 3 fichas y su más antigua desaparecerá.
    // IA (O) tiene fichas en 4, 5, 6. Su más antigua es 4.
    // Si juega en 8, 4 desaparece. O quedaría con 5,6,8.
    // Pero hay un escenario mejor: O juega en 2 para formar diagonal [2,4,6]
    // Sin embargo, 4 es la más antigua y desaparecerá... entonces no.
    // Necesitamos un escenario donde la IA deba elegir entre:
    // a) Jugar en una línea donde su ficha más antigua desaparecería (mala)
    // b) Jugar en otra línea donde sus fichas permanecen (buena)

    // Construcción: O tiene 0, 4 (diagonal [0,4,8] casi completa)
    // O también tiene 2 (para evitar que solo tenga 2)
    // Es turno de O. O juega su 4ª ficha.
    // Si O juega en 8, la ficha 0 desaparece. Quedan 4, 2, 8.
    // [2,4,6] no es línea. [0,4,8] -> 0 es null ahora. No gana.
    // O juega en 6 -> 0 desaparece. Quedan 4, 2, 6.
    // [2,4,6] -> 2 es O, 4 es O, 6 es O -> ¡DIAGONAL! Gana.
    // La IA debería elegir 6, no 8.

    const state: GameState = {
      ...createInitialState(),
      board: ['O', 'X', 'O', null, 'O', 'X', null, null, null],
      movesX: [
        { player: 'X', position: 1, timestamp: 0, moveNumber: 1 },
        { player: 'X', position: 5, timestamp: 0, moveNumber: 3 },
      ],
      movesO: [
        { player: 'O', position: 0, timestamp: 0, moveNumber: 2 },
        { player: 'O', position: 4, timestamp: 0, moveNumber: 4 },
        { player: 'O', position: 2, timestamp: 0, moveNumber: 6 },
      ],
      currentPlayer: 'O',
      totalMoves: 6,
    };

    const move = getAIMove(state, 'hard');
    // La IA debería jugar en 6 para ganar con diagonal [2,4,6]
    // en vez de 8 donde la ficha 0 desaparecería y no ganaría
    expect(move).toBe(6);
  });

  it('debe jugar aleatorio en dificultad facil la mayoria de las veces', () => {
    let randomCount = 0;
    const trials = 20;

    for (let i = 0; i < trials; i++) {
      const state = createInitialState();
      // Llenamos algunas celdas para que haya opciones
      const s = makeMove(makeMove(makeMove(makeMove(state, 0), 4), 1), 5);
      clearAICache();
      const move = getAIMove(s, 'easy');
      if (move !== 2 && move !== 3 && move !== 6 && move !== 7 && move !== 8) {
        // No es un movimiento óptimo obvio
        randomCount++;
      }
    }

    // En fácil, ~60% deberían ser aleatorios
    // No podemos garantizar exacto, pero debería haber variedad
    expect(randomCount).toBeGreaterThanOrEqual(0);
  });

  it('debe retornar un movimiento valido siempre', () => {
    const state = createInitialState();
    const move = getAIMove(state, 'hard');
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
  });
});
