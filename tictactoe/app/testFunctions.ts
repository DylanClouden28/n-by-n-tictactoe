import { evalBoardState, minimax } from "./minimax_depthLimit";

const testBoardState = () => {
  //Before win
  const boardSize = 3;
  const board1 = new Array<"X" | "O" | null>(
    "X",
    "O",
    null,
    "X",
    "O",
    null,
    null,
    "X",
    null
  );
  let result = evalBoardState(board1, boardSize);
  console.log("Result: ", result);

  //Has won
  const currentPlayer = "O";
  const board2 = new Array<"X" | "O" | null>(
    "X",
    "O",
    null,
    "X",
    "O",
    null,
    "O",
    "X",
    null
  );
  result = evalBoardState(board2, boardSize);
  console.log("Result: ", result);

  const resultMinimax = minimax(
    board2,
    0,
    currentPlayer === "O",
    3,
    -Infinity,
    Infinity,
    6
  );
  console.log("Minimax result: ", resultMinimax);
};

testBoardState();
