const checkMaxHasReached = (
  counts: { [key: string]: number[] },
  boardSize: number
): string | null => {
  for (const player of ["X", "O"]) {
    if (counts[player].some((count) => count === boardSize)) {
      return player;
    }
  }
  return null;
};

//Check the current state of the board to see if there is a winner
// Takes state of board
// Retunrs the current winner, X, O or null (Draw)
export const checkWinner = (
  board: Array<"X" | "O" | null>,
  boardSize: number
): string | null => {
  const countPerRow: { X: Array<number>; O: Array<number> } = {
    X: new Array(boardSize).fill(0),
    O: new Array(boardSize).fill(0),
  };
  const countPerColumn: { X: Array<number>; O: Array<number> } = {
    X: new Array(boardSize).fill(0),
    O: new Array(boardSize).fill(0),
  };
  const countDiagonals: { X: Array<number>; O: Array<number> } = {
    X: new Array(2).fill(0),
    O: new Array(2).fill(0),
  };

  for (let i = 0; i < boardSize * boardSize; i++) {
    const currentValue = board[i];
    if (currentValue == null) continue; // Value if not selected yet

    const currentRow = (i / boardSize) | 0; //Fast way to do int divison in javascript
    const currentColumn = i % boardSize;

    // Count rows
    countPerRow[currentValue][currentRow] += 1;
    // Check columns
    countPerColumn[currentValue][currentColumn] += 1;
    // Main Diagonal
    if (currentRow === currentColumn) {
      countDiagonals[currentValue][0] += 1;
    }
    // Second Diagonal
    if (currentRow + currentColumn === boardSize - 1) {
      countDiagonals[currentValue][1] += 1;
    }
    //Short Circuit if winner found
    for (const counts of [countPerRow, countPerColumn, countDiagonals]) {
      const winner = checkMaxHasReached(counts, boardSize);
      if (winner) return winner;
    }
  }

  return board.includes(null) ? null : "DRAW";
};

let miniMaxIterations = 0;
let highestDepth = 0;

const minimax = (
  board: Array<"X" | "O" | null>,
  depth: number,
  isMaximizing: boolean,
  boardSize: number,
  alpha: number = -Infinity,
  beta: number = Infinity
): number => {
  const winner = checkWinner(board, boardSize);
  miniMaxIterations += 1;
  if (highestDepth < depth) {
    highestDepth = depth;
  }
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
  board: Array<"X" | "O" | null>,
  boardSize: number,
  currentPlayer: "X" | "O"
): { bestMove: number; iterations: number } => {
  console.log("\nFinding best Move for computer");
  let bestMove = -1;
  miniMaxIterations = 0;
  let bestValue = currentPlayer === "X" ? -Infinity : Infinity;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = currentPlayer;
      console.log("Computing bestmove, checking move for: ", i);
      const moveValue = minimax(board, 0, currentPlayer === "O", boardSize);
      console.log("\tLargest Depth: ", highestDepth);
      highestDepth = 0;
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
  return { bestMove: bestMove, iterations: miniMaxIterations };
};
