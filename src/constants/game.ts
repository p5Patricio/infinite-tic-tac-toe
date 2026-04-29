export const BOARD_SIZE = 9;
export const MAX_MARKERS_PER_PLAYER = 3;

export const WINNING_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontales
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticales
  [0, 4, 8], [2, 4, 6],             // diagonales
];
