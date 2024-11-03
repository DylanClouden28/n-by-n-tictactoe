// minimax.ts
import { GameStatus } from "./page.tsx"; // Adjust path if necessary

// Function to check the winner for the current board state
export const checkWinner = (
  board: Array<string | null>,
  boardSize: number
): string | null => {
  // Check rows, columns, and diagonals for a winner
  for (let i = 0; i < boardSize; i++) {
    // Check rows
    if (
      board[i * boardSize] &&
      board
        .slice(i * boardSize, i * boardSize + boardSize)
        .every((cell) => cell === board[i * boardSize])
    ) {
      return board[i * boardSize];
    }
    // Check columns
    if (
      board[i] &&
      board
        .filter((_, idx) => idx % boardSize === i)
        .every((cell) => cell === board[i])
    ) {
      return board[i];
    }
  }

  // Check diagonals
  if (
    board[0] &&
    Array.from({ length: boardSize }).every(
      (_, i) => board[i * (boardSize + 1)] === board[0]
    )
  ) {
    return board[0];
  }
  if (
    board[boardSize - 1] &&
    Array.from({ length: boardSize }).every(
      (_, i) => board[(i + 1) * (boardSize - 1)] === board[boardSize - 1]
    )
  ) {
    return board[boardSize - 1];
  }

  return board.includes(null) ? null : "DRAW";
};
const minimax = (
  board: Array<string | null>,
  depth: number,
  isMaximizing: boolean,
  boardSize: number,
  alpha: number = -Infinity,
  beta: number = Infinity
): number => {
  const winner = checkWinner(board, boardSize);

  if (winner === "X") return 10 - depth;
  if (winner === "O") return depth - 10;
  if (winner === "DRAW") return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = "X";
        const evalScore = minimax(
          board,
          depth + 1,
          false,
          boardSize,
          alpha,
          beta
        );
        board[i] = null;
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Beta cut-off
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const evalScore = minimax(
          board,
          depth + 1,
          true,
          boardSize,
          alpha,
          beta
        );
        board[i] = null;
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha cut-off
      }
    }
    return minEval;
  }
};

// Function to determine the best move for the computer
export const getBestMove = (
  board: Array<string | null>,
  boardSize: number,
  currentPlayer: string
): number => {
  let bestMove = -1;
  let bestValue = currentPlayer === "X" ? -Infinity : Infinity;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = currentPlayer;
      const moveValue = minimax(board, 0, currentPlayer === "O", boardSize);
      board[i] = null;

      if (
        (currentPlayer === "X" && moveValue > bestValue) ||
        (currentPlayer === "O" && moveValue < bestValue)
      ) {
        bestValue = moveValue;
        bestMove = i;
      }
    }
  }
  return bestMove;
};
