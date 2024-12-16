"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { User, Computer, Trophy, Repeat, Swords } from "lucide-react";
import { checkWinner, getBestMove } from "./minimax";

enum GameMode {
  HUMAN_VS_HUMAN = "HUMAN_VS_HUMAN",
  HUMAN_VS_COMPUTER = "HUMAN_VS_COMPUTER",
  COMPUTER_VS_COMPUTER = "COMPUTER_VS_COMPUTER",
}

enum GameStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  WIN = "WIN",
  DRAW = "DRAW",
}

export default function TicTacToe() {
  const [boardSize, setBoardSize] = useState<number>(3);
  const [board, setBoard] = useState<Array<string | null>>(() =>
    Array(boardSize * boardSize).fill(null)
  );
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.HUMAN_VS_HUMAN);
  const [gameStatus, setGameStatus] = useState<GameStatus>(
    GameStatus.NOT_STARTED
  );
  const [winner, setWinner] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  const handleComputerMove = async (
    currentBoard: Array<string | null>,
    isX: boolean = false
  ) => {
    if (gameStatus !== GameStatus.IN_PROGRESS) return;

    const computerSymbol = isX ? "X" : "O";
    try {
      const bestMove = await getBestMove(
        currentBoard,
        boardSize,
        computerSymbol
      );

      if (bestMove !== -1) {
        const newBoard = [...currentBoard];
        newBoard[bestMove] = computerSymbol;
        setBoard(newBoard);

        const winner = checkWinner(newBoard, boardSize);
        if (winner) {
          handleGameOver(winner === "DRAW" ? null : winner);
        } else {
          setXIsNext(!isX);

          // If computer vs computer, trigger next move after delay
          if (gameMode === GameMode.COMPUTER_VS_COMPUTER && !winner) {
            setTimeout(() => handleComputerMove(newBoard, !isX), 1000);
          }
        }
      }
    } catch (error) {
      console.error("Error in computer move:", error);
    }
  };

  const handleGameOver = (winner: string | null) => {
    setGameStatus(winner ? GameStatus.WIN : GameStatus.DRAW);
    setWinner(winner);
  };

  const startGame = () => {
    setIsGameStarted(true);
    setGameStatus(GameStatus.IN_PROGRESS);
    setBoard(Array(boardSize * boardSize).fill(null));
    setXIsNext(true);
    setWinner(null);

    // If computer vs computer, start the game
    if (gameMode === GameMode.COMPUTER_VS_COMPUTER) {
      setTimeout(
        async () =>
          await handleComputerMove(
            Array(boardSize * boardSize).fill(null),
            true
          ),
        500
      );
    }
  };

  const handleSizeChange = (newSize: number) => {
    if (newSize < 3) newSize = 3;
    if (newSize > 10) newSize = 10;
    setBoardSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setXIsNext(true);
  };

  const handleClick = async (index: number) => {
    if (
      board[index] ||
      gameStatus !== GameStatus.IN_PROGRESS ||
      (gameMode === GameMode.HUMAN_VS_COMPUTER && !xIsNext)
    )
      return;

    const newBoard = [...board];
    newBoard[index] = xIsNext ? "X" : "O";
    setBoard(newBoard);

    const winner = checkWinner(newBoard, boardSize);
    if (winner) {
      handleGameOver(winner === "DRAW" ? null : winner);
    } else {
      setXIsNext(!xIsNext);

      // If playing against computer, trigger computer move
      if (gameMode === GameMode.HUMAN_VS_COMPUTER && !winner) {
        setTimeout(async () => await handleComputerMove(newBoard), 500);
      }
    }
  };

  const renderGameModeSelection = () => (
    <div className="space-y-4 mb-6">
      <Label className="text-lg">Select Game Mode</Label>
      <div className="flex gap-4 justify-center">
        <Button
          variant={gameMode === GameMode.HUMAN_VS_HUMAN ? "default" : "outline"}
          onClick={() => setGameMode(GameMode.HUMAN_VS_HUMAN)}
          className="flex gap-2 items-center"
        >
          <User className="h-4 w-4" />
          vs
          <User className="h-4 w-4" />
        </Button>
        <Button
          variant={
            gameMode === GameMode.HUMAN_VS_COMPUTER ? "default" : "outline"
          }
          onClick={() => setGameMode(GameMode.HUMAN_VS_COMPUTER)}
          className="flex gap-2 items-center"
        >
          <User className="h-4 w-4" />
          vs
          <Computer className="h-4 w-4" />
        </Button>
        <Button
          variant={
            gameMode === GameMode.COMPUTER_VS_COMPUTER ? "default" : "outline"
          }
          onClick={() => setGameMode(GameMode.COMPUTER_VS_COMPUTER)}
          className="flex gap-2 items-center"
        >
          <Computer className="h-4 w-4" />
          vs
          <Computer className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderGameStatus = () => {
    if (gameStatus === GameStatus.WIN && winner) {
      return (
        <Badge
          variant="default"
          className="text-lg px-4 py-2 flex items-center gap-2"
        >
          <Trophy className="h-5 w-5" />
          Player {winner} Wins!
        </Badge>
      );
    } else if (gameStatus === GameStatus.DRAW) {
      return (
        <Badge
          variant="secondary"
          className="text-lg px-4 py-2 flex items-center gap-2"
        >
          <Repeat className="h-5 w-5" />
          Draw Game
        </Badge>
      );
    } else if (gameStatus === GameStatus.IN_PROGRESS) {
      return (
        <Badge
          variant="outline"
          className="text-lg px-4 py-2 flex items-center gap-2"
        >
          <Swords className="h-5 w-5" />
          Next Player: {xIsNext ? "X" : "O"}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-[90vh] p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tic Tac Toe</h1>
          {renderGameStatus()}
        </div>

        {!isGameStarted && renderGameModeSelection()}
        {!isGameStarted && (
          <div className="space-y-2 flex flex-col items-center">
            <Label className="text-lg">
              Board Size: {boardSize}x{boardSize}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSizeChange(boardSize - 1)}
                disabled={boardSize <= 3}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-lg font-medium w-8 text-center">
                {boardSize}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSizeChange(boardSize + 1)}
                disabled={boardSize >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!isGameStarted ? (
          <Button
            variant="default"
            className="w-full text-lg py-6"
            onClick={startGame}
          >
            Start Game
          </Button>
        ) : (
          <div className="flex flex-col justify-center items-center">
            <div
              className="grid gap-2 max-w-lg"
              style={{
                gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                aspectRatio: "1/1",
                width: "100%",
              }}
            >
              {Array(boardSize * boardSize)
                .fill(null)
                .map((_, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="aspect-square flex items-center justify-center p-0 text-3xl font-bold w-full h-full"
                    onClick={() => handleClick(index)}
                    disabled={
                      gameMode === GameMode.COMPUTER_VS_COMPUTER ||
                      gameStatus !== GameStatus.IN_PROGRESS ||
                      board[index] !== null ||
                      (gameMode === GameMode.HUMAN_VS_COMPUTER && !xIsNext)
                    }
                  >
                    {board[index]}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {isGameStarted && (
          <Button
            variant="default"
            className="w-full text-lg py-6"
            onClick={() => {
              setIsGameStarted(false);
              setGameStatus(GameStatus.NOT_STARTED);
              setBoard(Array(boardSize * boardSize).fill(null));
              setXIsNext(true);
              setWinner(null);
            }}
          >
            New Game
          </Button>
        )}
      </Card>
    </div>
  );
}
