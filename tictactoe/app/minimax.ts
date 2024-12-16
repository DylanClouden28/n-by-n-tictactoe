// minimax.ts
import { GameStatus } from "./page.tsx"; // Adjust path if necessary

// Winner checking function remains the same
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

// Worker message types
interface WorkerInput {
  board: Array<string | null>;
  depth: number;
  isMaximizing: boolean;
  boardSize: number;
  moveIndex: number;
  currentPlayer: string;
}

interface WorkerOutput {
  moveIndex: number;
  value: number;
}

// Minimax function used by workers
const minimax = (
  board: Array<string | null>,
  depth: number,
  isMaximizing: boolean,
  boardSize: number
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
        const evalScore = minimax(board, depth + 1, false, boardSize);
        board[i] = null;
        maxEval = Math.max(maxEval, evalScore);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const evalScore = minimax(board, depth + 1, true, boardSize);
        board[i] = null;
        minEval = Math.min(minEval, evalScore);
      }
    }
    return minEval;
  }
};

// Worker code as a blob
const workerCode = `
  // Define the functions in the worker scope
  const checkWinner = ${checkWinner.toString()};
  const minimax = ${minimax.toString()};
  
  
  self.onmessage = function(e) {
    const { board, depth, isMaximizing, boardSize, moveIndex, currentPlayer } = e.data;
    const boardCopy = [...board];
    boardCopy[moveIndex] = currentPlayer;
    const value = minimax(boardCopy, depth, isMaximizing, boardSize);
    self.postMessage({ moveIndex, value });
  };
`;

// Create a worker from the blob
const createWorker = () => {
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
};

// Main getBestMove function with worker implementation
export const getBestMove = async (
  board: Array<string | null>,
  boardSize: number,
  currentPlayer: string
): Promise<number> => {
  // Get available moves
  const availableMoves = board.reduce<number[]>((moves, cell, index) => {
    if (cell === null) moves.push(index);
    return moves;
  }, []);

  if (availableMoves.length === 0) return -1;

  // Determine number of workers based on CPU cores and available moves
  const maxWorkers = Math.min(
    navigator.hardwareConcurrency || 4,
    availableMoves.length
  );
  const workers: Worker[] = [];
  const movePromises: Promise<WorkerOutput>[] = [];

  try {
    // Create workers
    for (let i = 0; i < maxWorkers; i++) {
      workers.push(createWorker());
    }

    // Distribute work among workers
    availableMoves.forEach((moveIndex, i) => {
      const workerIndex = i % maxWorkers;
      const promise = new Promise<WorkerOutput>((resolve) => {
        workers[workerIndex].onmessage = (e) => resolve(e.data);
      });

      const workerInput: WorkerInput = {
        board,
        depth: 0,
        isMaximizing: currentPlayer === "O",
        boardSize,
        moveIndex,
        currentPlayer,
      };

      workers[workerIndex].postMessage(workerInput);
      movePromises.push(promise);
    });

    // Wait for all calculations to complete
    const results = await Promise.all(movePromises);

    // Find best move
    let bestMove = -1;
    let bestValue = currentPlayer === "X" ? -Infinity : Infinity;

    results.forEach(({ moveIndex, value }) => {
      if (
        (currentPlayer === "X" && value > bestValue) ||
        (currentPlayer === "O" && value < bestValue)
      ) {
        bestValue = value;
        bestMove = moveIndex;
      }
    });

    return bestMove;
  } catch (error) {
    console.error("Error in getBestMove:", error);
    throw error;
  } finally {
    // Clean up workers
    workers.forEach((worker) => worker.terminate());
  }
};
