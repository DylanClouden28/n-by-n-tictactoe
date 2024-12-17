"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Minus, Plus } from "lucide-react";
import {
  User,
  Computer,
  Trophy,
  Repeat,
  Swords,
  Loader2,
  LoaderCircle,
} from "lucide-react";
import { checkWinner, getBestMove } from "./minimax_depthLimit";
import { getBestMove as getBestMoveAlphaBeta } from "./minimax_alphabeta";
import { getBestMove as getBestMoveMultithreading } from "./minimax_multithreading";
import { getBestMove as getBestMovePlain } from "./minimax_plain";

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

interface GameStats {
  winner: string | null;
  moves: number;
  totalIterations: number;
  duration: number;
}

enum MinimaxImplementation {
  PLAIN = "PLAIN (Very Slow)",
  DEPTH_LIMIT = "DEPTH_LIMIT",
  ALPHA_BETA = "ALPHA_BETA",
  MULTITHREADING = "MULTITHREADING",
}

export default function TicTacToe() {
  const [boardSize, setBoardSize] = useState<number>(3);
  const [board, setBoard] = useState<Array<"X" | "O" | null>>(() =>
    Array(boardSize * boardSize).fill(null)
  );
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.HUMAN_VS_HUMAN);
  const [gameStatus, setGameStatus] = useState<GameStatus>(
    GameStatus.NOT_STARTED
  );
  const [winner, setWinner] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<{ iterations: number } | null>(
    null
  );
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkStats, setBenchmarkStats] = useState<{
    gamesCompleted: number;
    totalTime: number;
    results: GameStats[];
  }>({ gamesCompleted: 0, totalTime: 0, results: [] });
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchMarkCount, setBenchMarkCount] = useState<number>(100);
  const [minimaxImpl, setMinimaxImpl] = useState<MinimaxImplementation>(
    MinimaxImplementation.DEPTH_LIMIT
  );

  const benchmarkRunner = async (timesToRun: number) => {
    //console.log("Starting benchmark with implementation:", minimaxImpl);
    setIsBenchmarking(true);
    const results: GameStats[] = [];
    const totalStartTime = performance.now();
    const updateInterval = Math.max(Math.floor(timesToRun / 10), 1);

    for (let i = 0; i < timesToRun; i++) {
      //console.log(`Starting game ${i + 1}/${timesToRun}`);
      const gameStats = await runSingleGame();
      //console.log(`Completed game ${i + 1}, stats:`, gameStats);
      results.push(gameStats);

      if (i % updateInterval === 0 || i === timesToRun - 1) {
        setBenchmarkProgress(((i + 1) / timesToRun) * 100);
        await new Promise(requestAnimationFrame);
      }
    }

    const totalTime = performance.now() - totalStartTime;
    //console.log("Benchmark complete, total time:", totalTime);

    setBenchmarkStats({
      gamesCompleted: timesToRun,
      totalTime: totalTime,
      results: results,
    });
    setIsBenchmarking(false);
    setBenchmarkProgress(0);
  };

  const getBestMoveForImplementation = async (
    board: Array<"X" | "O" | null>,
    size: number,
    player: "X" | "O",
    depth: number
  ) => {
    switch (minimaxImpl) {
      case MinimaxImplementation.PLAIN:
        return getBestMovePlain(board, size, player);
      case MinimaxImplementation.ALPHA_BETA:
        return getBestMoveAlphaBeta(board, size, player);
      case MinimaxImplementation.MULTITHREADING:
        return await getBestMoveMultithreading(board, size, player);
      case MinimaxImplementation.DEPTH_LIMIT:
      default:
        return getBestMove(board, size, player, depth);
    }
  };

  const runSingleGame = async (): Promise<GameStats> => {
    //console.log("Starting new game");
    const startTime = performance.now();
    let currentBoard = Array(boardSize * boardSize).fill(null);
    let isX = true;
    let moves = 0;
    let totalIterations = 0;
    let gameWinner = null;

    try {
      while (true) {
        //console.log(`Move ${moves + 1}, player: ${isX ? "X" : "O"}`);
        const { bestMove, iterations } = await getBestMoveForImplementation(
          currentBoard,
          boardSize,
          isX ? "X" : "O",
          4
        );
        //console.log(`Received move: ${bestMove}, iterations: ${iterations}`);

        totalIterations += iterations;

        if (bestMove !== -1) {
          currentBoard = [...currentBoard];
          currentBoard[bestMove] = isX ? "X" : "O";
          moves++;
          //console.log("Current board:", currentBoard);

          const winner = checkWinner(currentBoard, boardSize);
          if (winner) {
            gameWinner = winner === "DRAW" ? null : winner;
            //console.log("Game complete with winner:", gameWinner);
            break;
          }

          isX = !isX;
        } else {
          //console.log("No valid move found, ending game");
          break;
        }
      }

      const duration = performance.now() - startTime;
      const stats = {
        winner: gameWinner,
        moves,
        totalIterations,
        duration,
      };
      //console.log("Game complete, stats:", stats);
      return stats;
    } catch (error) {
      console.error("Game error:", error);
      throw error;
    }
  };

  const handleComputerMove = (
    currentBoard: Array<"X" | "O" | null>,
    isX: boolean = false
  ) => {
    const computerSymbol = isX ? "X" : "O";
    const MaxDepth = 4;
    const { bestMove, iterations } = getBestMove(
      currentBoard,
      boardSize,
      computerSymbol,
      MaxDepth
    );

    //console.log("\tBest move found: ", bestMove, " | iters: ", iterations);

    if (bestMove !== -1) {
      const newBoard = [...currentBoard];
      newBoard[bestMove] = computerSymbol;
      setBoard(newBoard);
      setDebugInfo({ iterations: iterations });

      const winner = checkWinner(newBoard, boardSize);
      if (winner) {
        handleGameOver(winner === "DRAW" ? null : winner);
      } else {
        setXIsNext(!isX);

        // If computer vs computer, trigger next move after delay
        if (gameMode === GameMode.COMPUTER_VS_COMPUTER && !winner) {
          //console.log("\tStarting to trigger next move for computer");
          handleComputerMove(newBoard, !isX);
        }
      }
    }
  };

  const handleGameOver = (winner: string | null) => {
    setGameStatus(winner ? GameStatus.WIN : GameStatus.DRAW);
    setWinner(winner);
    setDebugInfo(null);
  };

  const startGame = () => {
    setIsGameStarted(true);
    setGameStatus(GameStatus.IN_PROGRESS);
    setBoard(Array(boardSize * boardSize).fill(null));
    setXIsNext(true);
    setWinner(null);
    setDebugInfo(null);
    setBenchmarkProgress(0);
    setBenchmarkStats({ gamesCompleted: 0, totalTime: 0, results: [] });

    if (gameMode === GameMode.COMPUTER_VS_COMPUTER) {
      // Run benchmark instead of single game
      benchmarkRunner(benchMarkCount);
    } else {
      // Normal game modes (Human vs Human or Human vs Computer)
      setIsBenchmarking(false);
      if (gameMode === GameMode.HUMAN_VS_COMPUTER && !xIsNext) {
        // If computer goes first in Human vs Computer mode
        setTimeout(
          () => handleComputerMove(Array(boardSize * boardSize).fill(null)),
          500
        );
      }
    }
  };

  const handleSizeChange = (newSize: number) => {
    if (newSize < 3) newSize = 3;
    if (newSize > 10) newSize = 10;
    setBoardSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setXIsNext(true);
  };

  const handleClick = (index: number) => {
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
        setTimeout(() => handleComputerMove(newBoard), 0);
      }
    }
  };

  const renderBenchmarkDisplay = () => {
    // Always show progress while benchmarking
    if (isBenchmarking) {
      return (
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Running Benchmark...</span>
          </div>
          <Progress value={benchmarkProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Completed {Math.floor((benchmarkProgress / 100) * benchMarkCount)}{" "}
            of {benchMarkCount} games
          </p>
        </div>
      );
    }

    // Show results when done
    if (benchmarkStats.results.length > 0) {
      // Removed !isBenchmarking condition
      const totalGames = benchmarkStats.results.length;
      const winCounts = benchmarkStats.results.reduce((counts, game) => {
        const result = game.winner || "Draw";
        counts[result] = (counts[result] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const avgMoves =
        benchmarkStats.results.reduce((sum, game) => sum + game.moves, 0) /
        totalGames;
      const avgTime =
        benchmarkStats.results.reduce((sum, game) => sum + game.duration, 0) /
        totalGames;

      const totalIterations = benchmarkStats.results.reduce(
        (sum, game) => sum + game.totalIterations,
        0
      );
      const avgIterationsPerGame = totalIterations / totalGames;

      return (
        <div className="w-full space-y-4">
          <h3 className="text-lg font-semibold">Benchmark Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Games Statistics</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Total Games: {totalGames}</p>
                <p>Average Moves: {avgMoves.toFixed(1)}</p>
                <p>
                  Total Time: {(benchmarkStats.totalTime / 1000).toFixed(2)}s
                </p>
                <p>Average Time per Game: {(avgTime / 1000).toFixed(2)}s</p>
                <p>Total Iterations: {totalIterations.toLocaleString()}</p>
                <p>
                  Iterations per Game:{" "}
                  {avgIterationsPerGame.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Game Outcomes</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                {Object.entries(winCounts).map(([result, count]) => (
                  <p key={result}>
                    {result}: {count} ({((count / totalGames) * 100).toFixed(1)}
                    %)
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
          className="flex gap-2 items-center flex-col h-full"
        >
          <div className="flex gap-2 flex-row">
            <Computer className="h-4 w-4" />
            vs
            <Computer className="h-4 w-4" />
          </div>
          <Label className="text-sm">Runs Benchmark</Label>
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
          {benchmarkStats.results.length === 0 && renderGameStatus()}
        </div>

        {/* Show game mode selection if not started and no benchmark results */}
        {!isGameStarted &&
          benchmarkStats.results.length === 0 &&
          renderGameModeSelection()}

        {/* Show either benchmark progress/results or game board */}
        {isGameStarted && (
          <>
            {/* Show benchmark progress or results */}
            {(isBenchmarking ||
              (gameMode === GameMode.COMPUTER_VS_COMPUTER &&
                benchmarkStats.results.length > 0)) &&
              renderBenchmarkDisplay()}

            {/* Only show game board for non-benchmark modes */}
            {gameMode !== GameMode.COMPUTER_VS_COMPUTER && (
              <div className="flex flex-col justify-center items-center">
                {debugInfo && (
                  <div className="p-2">
                    <Badge className="text-lg">
                      Number of iterations: {debugInfo.iterations}
                    </Badge>
                  </div>
                )}
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
          </>
        )}

        {/* Show board size and benchmark count controls */}
        {!isGameStarted && benchmarkStats.results.length === 0 && (
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
            {gameMode === GameMode.COMPUTER_VS_COMPUTER && (
              <div className="space-y-4 w-full max-w-xs mx-auto">
                <div className="space-y-2">
                  <Label>Minimax Implementation</Label>
                  <Select
                    value={minimaxImpl}
                    onValueChange={(value) =>
                      setMinimaxImpl(value as MinimaxImplementation)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select implementation" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MinimaxImplementation).map((impl) => (
                        <SelectItem key={impl} value={impl}>
                          {impl.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of benchmark runs (1-100)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={benchMarkCount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setBenchMarkCount(Math.min(100, Math.max(1, value)));
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show appropriate button based on state */}
        {!isGameStarted && benchmarkStats.results.length === 0 ? (
          <Button
            variant="default"
            className="w-full text-lg py-6"
            onClick={startGame}
          >
            {isBenchmarking ? <LoaderCircle></LoaderCircle> : "Start Game"}
          </Button>
        ) : (
          <Button
            variant="default"
            className="w-full text-lg py-6"
            onClick={() => {
              setIsGameStarted(false);
              setGameStatus(GameStatus.NOT_STARTED);
              setBoard(Array(boardSize * boardSize).fill(null));
              setXIsNext(true);
              setWinner(null);
              setDebugInfo(null);
              // Clear benchmark results when starting new game/benchmark
              setBenchmarkStats({
                gamesCompleted: 0,
                totalTime: 0,
                results: [],
              });
              setBenchmarkProgress(0);
            }}
          >
            New Game
          </Button>
        )}
      </Card>
    </div>
  );
}
