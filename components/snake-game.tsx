"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Position {
  x: number
  y: number
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [snake, setSnake] = useState<Position[]>([{ x: 5, y: 5 }])
  const [food, setFood] = useState<Position>({ x: 10, y: 10 })
  const [direction, setDirection] = useState<string>("right")
  const [gameRunning, setGameRunning] = useState(false)

  // Game settings
  const gridSize = 20
  const gameSpeed = 100
  const canvasSize = 400

  // Generate random food position
  const getRandomFoodPosition = (): Position => {
    const position = {
      x: Math.floor(Math.random() * (canvasSize / gridSize)),
      y: Math.floor(Math.random() * (canvasSize / gridSize)),
    }

    // Make sure food doesn't spawn on snake
    if (snake.some((segment) => segment.x === position.x && segment.y === position.y)) {
      return getRandomFoodPosition()
    }

    return position
  }

  // Start a new game
  const startGame = () => {
    // Reset all game state
    setSnake([{ x: 5, y: 5 }])
    setFood(getRandomFoodPosition())
    setDirection("right")
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
    setGameRunning(true)
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return

      switch (e.key) {
        case "ArrowUp":
          if (direction !== "down") {
            setDirection("up")
          }
          break
        case "ArrowDown":
          if (direction !== "up") {
            setDirection("down")
          }
          break
        case "ArrowLeft":
          if (direction !== "right") {
            setDirection("left")
          }
          break
        case "ArrowRight":
          if (direction !== "left") {
            setDirection("right")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameStarted, gameOver, direction])

  // Game loop
  useEffect(() => {
    if (!gameRunning || gameOver) return

    const gameLoop = setInterval(() => {
      moveSnake()
    }, gameSpeed)

    return () => clearInterval(gameLoop)
  }, [gameRunning, gameOver, snake, food, direction])

  // Move snake and handle collisions
  const moveSnake = () => {
    setSnake((prevSnake) => {
      // Create new head based on direction
      const head = { ...prevSnake[0] }

      switch (direction) {
        case "up":
          head.y -= 1
          break
        case "down":
          head.y += 1
          break
        case "left":
          head.x -= 1
          break
        case "right":
          head.x += 1
          break
      }

      // Check for collisions
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= canvasSize / gridSize ||
        head.y >= canvasSize / gridSize ||
        prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        setGameOver(true)
        setGameRunning(false)
        if (score > highScore) {
          setHighScore(score)
        }
        playSound("die")
        return prevSnake
      }

      // Create new snake
      const newSnake = [head, ...prevSnake]

      // Check if snake ate food
      if (head.x === food.x && head.y === food.y) {
        setFood(getRandomFoodPosition())
        setScore((prevScore) => prevScore + 10)
        playSound("eat")
      } else {
        // Remove tail if no food was eaten
        newSnake.pop()
      }

      return newSnake
    })
  }

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#111111"
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    // Draw food
    ctx.fillStyle = "#22cc22"
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize)

    // Draw snake
    snake.forEach((segment, index) => {
      // Head is slightly different color
      ctx.fillStyle = index === 0 ? "#00ff00" : "#00dd00"
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize)

      // Add pixel effect
      ctx.fillStyle = index === 0 ? "#00dd00" : "#00bb00"
      ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4)
    })

    // Draw grid lines for retro effect
    ctx.strokeStyle = "#222222"
    ctx.lineWidth = 0.5

    for (let i = 0; i <= canvasSize; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvasSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvasSize, i)
      ctx.stroke()
    }
  }, [snake, food])

  // Simple sound effects
  const playSound = (type: "eat" | "die") => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      if (type === "eat") {
        oscillator.type = "square"
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
      } else if (type === "die") {
        oscillator.type = "sawtooth"
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.5)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.5)
      }
    } catch (error) {
      console.error("Error playing sound:", error)
    }
  }

  return (
    <div className="p-4 h-full flex flex-col items-center justify-center bg-black">
      <Card className="max-w-[440px] w-full border-2 border-green-500 bg-black text-green-500 font-mono">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xl">SNAKE</div>
            <div className="flex gap-4">
              <div>SCORE: {score}</div>
              <div>HI-SCORE: {highScore}</div>
            </div>
          </div>

          <div className="relative border-2 border-green-700">
            <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="block w-full aspect-square" />

            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
                <div className="text-2xl mb-4 text-center">SNAKE GAME</div>
                <div className="mb-6 text-center text-sm">Use arrow keys to move</div>
                <Button onClick={startGame} className="bg-green-600 hover:bg-green-700 text-black font-bold">
                  START GAME
                </Button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
                <div className="text-2xl mb-4">GAME OVER</div>
                <div className="mb-2">SCORE: {score}</div>
                <Button onClick={startGame} className="bg-green-600 hover:bg-green-700 text-black font-bold mt-4">
                  PLAY AGAIN
                </Button>
              </div>
            )}
          </div>

          {gameStarted && !gameOver && (
            <div className="mt-4 text-center text-sm">Use arrow keys to control the snake</div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
            <div></div>
            <Button
              onClick={() => {
                if (direction !== "down" && gameStarted && !gameOver) {
                  setDirection("up")
                }
              }}
              className="bg-green-700 hover:bg-green-600 text-black font-bold"
            >
              ↑
            </Button>
            <div></div>
            <Button
              onClick={() => {
                if (direction !== "right" && gameStarted && !gameOver) {
                  setDirection("left")
                }
              }}
              className="bg-green-700 hover:bg-green-600 text-black font-bold"
            >
              ←
            </Button>
            <Button
              onClick={() => {
                if (direction !== "up" && gameStarted && !gameOver) {
                  setDirection("down")
                }
              }}
              className="bg-green-700 hover:bg-green-600 text-black font-bold"
            >
              ↓
            </Button>
            <Button
              onClick={() => {
                if (direction !== "left" && gameStarted && !gameOver) {
                  setDirection("right")
                }
              }}
              className="bg-green-700 hover:bg-green-600 text-black font-bold"
            >
              →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
