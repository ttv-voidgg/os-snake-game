"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Cell {
    isMine: boolean
    isRevealed: boolean
    isFlagged: boolean
    adjacentMines: number
}

type GameStatus = "waiting" | "playing" | "won" | "lost"

interface GameSettings {
    rows: number
    cols: number
    mines: number
}

const DIFFICULTY_PRESETS = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 },
}

export default function Minesweeper() {
    const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "expert">("beginner")
    const [settings, setSettings] = useState<GameSettings>(DIFFICULTY_PRESETS.beginner)
    const [board, setBoard] = useState<Cell[][]>([])
    const [gameStatus, setGameStatus] = useState<GameStatus>("waiting")
    const [minesLeft, setMinesLeft] = useState(0)
    const [time, setTime] = useState(0)
    const [faceStatus, setFaceStatus] = useState<"smile" | "wow" | "dead" | "cool">("smile")
    const [mouseDown, setMouseDown] = useState(false)

    // Initialize the game board
    const initializeBoard = useCallback(() => {
        const { rows, cols, mines } = settings

        // Create empty board
        const newBoard: Cell[][] = Array(rows)
            .fill(null)
            .map(() =>
                Array(cols)
                    .fill(null)
                    .map(() => ({
                        isMine: false,
                        isRevealed: false,
                        isFlagged: false,
                        adjacentMines: 0,
                    })),
            )

        // Place mines randomly
        let minesPlaced = 0
        while (minesPlaced < mines) {
            const row = Math.floor(Math.random() * rows)
            const col = Math.floor(Math.random() * cols)

            if (!newBoard[row][col].isMine) {
                newBoard[row][col].isMine = true
                minesPlaced++
            }
        }

        // Calculate adjacent mines
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (newBoard[row][col].isMine) continue

                let count = 0
                // Check all 8 adjacent cells
                for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                        if (r === row && c === col) continue
                        if (newBoard[r][c].isMine) count++
                    }
                }

                newBoard[row][col].adjacentMines = count
            }
        }

        setBoard(newBoard)
        setMinesLeft(mines)
        setTime(0)
        setGameStatus("waiting")
        setFaceStatus("smile")
    }, [settings])

    // Start a new game
    const startNewGame = (newDifficulty?: "beginner" | "intermediate" | "expert") => {
        if (newDifficulty) {
            setDifficulty(newDifficulty)
            setSettings(DIFFICULTY_PRESETS[newDifficulty])
        } else {
            initializeBoard()
        }
    }

    // Initialize board when settings change
    useEffect(() => {
        initializeBoard()
    }, [settings, initializeBoard])

    // Timer logic
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null

        if (gameStatus === "playing") {
            timer = setInterval(() => {
                setTime((prevTime) => prevTime + 1)
            }, 1000)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [gameStatus])

    // Handle cell reveal
    const revealCell = (row: number, col: number) => {
        if (gameStatus === "lost" || gameStatus === "won") return
        if (board[row][col].isFlagged || board[row][col].isRevealed) return

        // Start game on first click
        if (gameStatus === "waiting") {
            setGameStatus("playing")
        }

        const newBoard = [...board]

        // If it's a mine, game over
        if (newBoard[row][col].isMine) {
            // Reveal all mines
            for (let r = 0; r < settings.rows; r++) {
                for (let c = 0; c < settings.cols; c++) {
                    if (newBoard[r][c].isMine) {
                        newBoard[r][c].isRevealed = true
                    }
                }
            }

            setBoard(newBoard)
            setGameStatus("lost")
            setFaceStatus("dead")
            return
        }

        // Reveal the cell
        revealCellRecursive(newBoard, row, col)
        setBoard(newBoard)

        // Check if player won
        checkWinCondition(newBoard)
    }

    // Recursively reveal cells (for empty cells)
    const revealCellRecursive = (board: Cell[][], row: number, col: number) => {
        if (row < 0 || row >= settings.rows || col < 0 || col >= settings.cols) return
        if (board[row][col].isRevealed || board[row][col].isFlagged) return

        board[row][col].isRevealed = true

        // If it's an empty cell, reveal adjacent cells
        if (board[row][col].adjacentMines === 0) {
            for (let r = Math.max(0, row - 1); r <= Math.min(settings.rows - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(settings.cols - 1, col + 1); c++) {
                    if (r === row && c === col) continue
                    revealCellRecursive(board, r, c)
                }
            }
        }
    }

    // Toggle flag on a cell
    const toggleFlag = (row: number, col: number) => {
        if (gameStatus !== "playing" && gameStatus !== "waiting") return
        if (board[row][col].isRevealed) return

        const newBoard = [...board]

        // Start game on first click
        if (gameStatus === "waiting") {
            setGameStatus("playing")
        }

        newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged
        setBoard(newBoard)

        // Update mines left counter
        setMinesLeft((prevMinesLeft) => (newBoard[row][col].isFlagged ? prevMinesLeft - 1 : prevMinesLeft + 1))
    }

    // Check if player has won
    const checkWinCondition = (board: Cell[][]) => {
        for (let row = 0; row < settings.rows; row++) {
            for (let col = 0; col < settings.cols; col++) {
                // If there's a non-mine cell that's not revealed, game is not won yet
                if (!board[row][col].isMine && !board[row][col].isRevealed) {
                    return
                }
            }
        }

        // All non-mine cells are revealed, player wins!
        setGameStatus("won")
        setFaceStatus("cool")

        // Flag all mines
        const newBoard = [...board]
        for (let row = 0; row < settings.rows; row++) {
            for (let col = 0; col < settings.cols; col++) {
                if (newBoard[row][col].isMine && !newBoard[row][col].isFlagged) {
                    newBoard[row][col].isFlagged = true
                }
            }
        }

        setBoard(newBoard)
        setMinesLeft(0)
    }

    // Handle mouse events for face expressions
    const handleMouseDown = () => {
        if (gameStatus === "playing") {
            setMouseDown(true)
            setFaceStatus("wow")
        }
    }

    const handleMouseUp = () => {
        if (gameStatus === "playing") {
            setMouseDown(false)
            setFaceStatus("smile")
        }
    }

    // Get cell color based on adjacent mines
    const getCellColor = (adjacentMines: number): string => {
        switch (adjacentMines) {
            case 1:
                return "text-blue-600"
            case 2:
                return "text-green-600"
            case 3:
                return "text-red-600"
            case 4:
                return "text-blue-800"
            case 5:
                return "text-red-800"
            case 6:
                return "text-teal-600"
            case 7:
                return "text-black"
            case 8:
                return "text-gray-600"
            default:
                return ""
        }
    }

    // Format time display
    const formatTime = (time: number): string => {
        return time.toString().padStart(3, "0")
    }

    return (
        <div className="p-4 h-full flex flex-col items-center justify-center bg-gray-200">
            <Card className="p-2 border-2 border-gray-400 bg-gray-200 shadow-lg">
                {/* Game header */}
                <div className="flex justify-between items-center mb-2 px-2">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startNewGame("beginner")}
                            className={`text-xs ${difficulty === "beginner" ? "bg-blue-200" : ""}`}
                        >
                            Beginner
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startNewGame("intermediate")}
                            className={`text-xs ${difficulty === "intermediate" ? "bg-blue-200" : ""}`}
                        >
                            Intermediate
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startNewGame("expert")}
                            className={`text-xs ${difficulty === "expert" ? "bg-blue-200" : ""}`}
                        >
                            Expert
                        </Button>
                    </div>
                </div>

                {/* Game controls */}
                <div className="flex justify-between items-center p-2 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-500 bg-gray-300 mb-2">
                    {/* Mines counter */}
                    <div className="bg-black text-red-500 font-mono font-bold px-2 py-1 border-2 border-gray-600 w-16 text-center">
                        {minesLeft.toString().padStart(3, "0")}
                    </div>

                    {/* Face button */}
                    <button
                        onClick={() => startNewGame()}
                        className="w-10 h-10 flex items-center justify-center bg-gray-300 border-t-2 border-l-2 border-gray-200 border-b-2 border-r-2 border-gray-600 active:border-t-2 active:border-l-2 active:border-gray-600 active:border-b-2 active:border-r-2 active:border-gray-200"
                    >
                        {faceStatus === "smile" && "🙂"}
                        {faceStatus === "wow" && "😮"}
                        {faceStatus === "dead" && "😵"}
                        {faceStatus === "cool" && "😎"}
                    </button>

                    {/* Timer */}
                    <div className="bg-black text-red-500 font-mono font-bold px-2 py-1 border-2 border-gray-600 w-16 text-center">
                        {formatTime(time)}
                    </div>
                </div>

                {/* Game board */}
                <div
                    className="border-t-2 border-l-2 border-gray-500 border-b-2 border-r-2 border-white p-1 bg-gray-400"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        if (mouseDown) {
                            setMouseDown(false)
                            if (gameStatus === "playing") setFaceStatus("smile")
                        }
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateRows: `repeat(${settings.rows}, 1fr)`,
                            gridTemplateColumns: `repeat(${settings.cols}, 1fr)`,
                            gap: "1px",
                        }}
                    >
                        {board.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`w-6 h-6 flex items-center justify-center text-sm font-bold select-none
                    ${
                                        cell.isRevealed
                                            ? "bg-gray-300 border border-gray-400"
                                            : "bg-gray-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-600 active:border active:border-gray-400"
                                    }
                    ${getCellColor(cell.adjacentMines)}
                  `}
                                    onClick={() => revealCell(rowIndex, colIndex)}
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        toggleFlag(rowIndex, colIndex)
                                    }}
                                >
                                    {cell.isRevealed
                                        ? cell.isMine
                                            ? "💣"
                                            : cell.adjacentMines > 0
                                                ? cell.adjacentMines
                                                : ""
                                        : cell.isFlagged
                                            ? "🚩"
                                            : ""}
                                </button>
                            )),
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
