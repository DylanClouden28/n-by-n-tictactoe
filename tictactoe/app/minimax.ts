//
// Notes to future self for better optimziation make this whole board a class, with functions for changing
// the current state of that class as then the board state like total per row or columns can be updated on the fly and not need this super
// long calcuations to find totals allowing for near O(1) checks for winning state and board evals. Instead of N^2 checks
//

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

const evalBoardState = (
  board: Array<"X" | "O" | null>,
  boardSize: number
): { score: { X: number; O: number }; winner: string | null } => {
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

  const unblockedPerRow = {
    X: {
      size: new Array(boardSize).fill(0) as Array<number>,
      blocked: new Array(boardSize).fill(false) as Array<boolean>,
      usedBy: new Array(boardSize).fill(null) as Array<"X" | "O" | null>,
    },
    O: {
      size: new Array(boardSize).fill(0) as Array<number>,
      blocked: new Array(boardSize).fill(false) as Array<boolean>,
      usedBy: new Array(boardSize).fill(null) as Array<"X" | "O" | null>,
    },
  };
  const unblockedPerColumn = {
    X: {
      size: new Array(boardSize).fill(0) as Array<number>,
      blocked: new Array(boardSize).fill(false) as Array<boolean>,
      usedBy: new Array(boardSize).fill(null) as Array<"X" | "O" | null>,
    },
    O: {
      size: new Array(boardSize).fill(0) as Array<number>,
      blocked: new Array(boardSize).fill(false) as Array<boolean>,
      usedBy: new Array(boardSize).fill(null) as Array<"X" | "O" | null>,
    },
  };

  for (let i = 0; i < boardSize * boardSize; i++) {
    const currentValue = board[i];
    if (currentValue == null) continue; // Value if not selected yet

    const currentRow = (i / boardSize) | 0; //Fast way to do int divison in javascript
    const currentColumn = i % boardSize;

    // Count rows
    countPerRow[currentValue][currentRow] += 1;
    if (
      !unblockedPerRow[currentValue].blocked[currentRow] &&
      (unblockedPerRow[currentValue].usedBy[currentRow] === null ||
        unblockedPerRow[currentValue].usedBy[currentRow] === currentValue)
    ) {
      unblockedPerRow[currentValue].size[currentRow] += 1;
      unblockedPerRow[currentValue].usedBy[currentRow] = currentValue;
    } else {
      unblockedPerRow[currentValue].blocked[currentRow] = true;
    }
    // Check columns
    countPerColumn[currentValue][currentColumn] += 1;
    if (
      !unblockedPerColumn[currentValue].blocked[currentColumn] &&
      (unblockedPerColumn[currentValue].usedBy[currentColumn] === null ||
        unblockedPerColumn[currentValue].usedBy[currentColumn] === currentValue)
    ) {
      unblockedPerColumn[currentValue].size[currentColumn] += 1;
      unblockedPerColumn[currentValue].usedBy[currentColumn] = currentValue;
    } else {
      unblockedPerColumn[currentValue].blocked[currentColumn] = true;
    }
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
      if (winner) return { score: { X: 100000, O: -100000 }, winner: winner };
    }
  }

  let totalScore = { X: 0, O: 0 };

  //Add rows, columns, and diagonals to total score for each X and O
  for (const symbol of ["X", "O"] as Array<"X" | "O">) {
    totalScore[symbol] += countPerRow[symbol].reduce((a, b) => a + b, 0);
    totalScore[symbol] += countPerColumn[symbol].reduce((a, b) => a + b, 0);
    totalScore[symbol] += countDiagonals[symbol].reduce((a, b) => a + b, 0);
  }

  //Function to weight unblocked lines of symbols when closer to full line
  const weightSymbolLines = (boardSize: number, lineLength: number): number => {
    if (lineLength === boardSize - 1) {
      // Near-win condition should be weighted much higher
      return Math.pow(10, boardSize);
    }
    const generalWeight = 1;
    const proximityToWin = lineLength / boardSize;
    const weight = Math.pow(2, lineLength) * proximityToWin;
    return generalWeight * weight;
  };
  // const weightSymbolLines = (
  //   boardSize: number,
  //   lineLength: number
  // ): number => {
  //   const generalWeight = 1;
  //   const weight = lineLength ** 2 / boardSize;
  //   return generalWeight * weight;
  // };

  //Add unblocked rows and columns
  for (const symbol of ["X", "O"] as Array<"X" | "O">) {
    let unblockedTotal = 0;
    unblockedPerRow[symbol].size.forEach((value, index) => {
      if (!unblockedPerRow[symbol].blocked[index]) {
        unblockedTotal += weightSymbolLines(boardSize, value);
      }
    });
    unblockedPerColumn[symbol].size.forEach((value, index) => {
      if (!unblockedPerColumn[symbol].blocked[index]) {
        unblockedTotal += weightSymbolLines(boardSize, value);
      }
    });
    totalScore[symbol] += unblockedTotal;
  }

  return { score: totalScore, winner: null };
};

let miniMaxIterations = 0;
let highestDepth = 0;

const minimax = (
  board: Array<"X" | "O" | null>,
  depth: number,
  isMaximizing: boolean,
  boardSize: number,
  alpha: number = -Infinity,
  beta: number = Infinity,
  maxDepth: number
): number => {
  const { winner, score } = evalBoardState(board, boardSize);
  miniMaxIterations += 1;
  if (highestDepth < depth) {
    highestDepth = depth;
  }
  if (winner === "X") return 100000;
  if (winner === "O") return -100000;
  if (winner === "DRAW") return 0;

  // Return evaluation if we've hit depth limit
  if (depth >= maxDepth) {
    // For X (maximizing), we want score.X - score.O
    // For O (minimizing), we want score.O - score.X
    return isMaximizing ? score.X - score.O : score.O - score.X;
  }

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
          beta,
          maxDepth
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
          beta,
          maxDepth
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
  currentPlayer: "X" | "O",
  MaxDepth = 7
): { bestMove: number; iterations: number } => {
  console.log("\nFinding best Move for computer");
  let bestMove = -1;
  miniMaxIterations = 0;
  let bestValue = currentPlayer === "X" ? -Infinity : Infinity;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = currentPlayer;
      console.log("\tComputing bestmove, checking move for: ", i);
      const moveValue = minimax(
        board,
        0,
        currentPlayer === "O",
        boardSize,
        -Infinity,
        Infinity,
        MaxDepth
      );
      console.log("\tLargest Depth: ", highestDepth);
      console.log("\tMove Value: ", moveValue);
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
  console.log("\nBest Move found: ", bestMove);
  return { bestMove: bestMove, iterations: miniMaxIterations };
};
