"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Minus, Square, Volume2 } from "lucide-react"
import SnakeGame from "@/components/snake-game"

interface WindowPosition {
  x: number
  y: number
}

interface WindowState {
  id: string
  title: string
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  content: React.ReactNode
  icon: string
  position: WindowPosition
  zIndex: number
}

export default function WindowsDesktop() {
  const [windows, setWindows] = useState<WindowState[]>([])
  const [activeWindow, setActiveWindow] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<WindowPosition>({ x: 0, y: 0 })
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [highestZIndex, setHighestZIndex] = useState(10)

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Initialize windows
  useEffect(() => {
    setWindows([
      {
        id: "snake",
        title: "Snake Game",
        isOpen: false,
        isMinimized: false,
        isMaximized: true,
        content: <SnakeGame />,
        icon: "🎮",
        position: { x: 100, y: 50 },
        zIndex: 10,
      },
      {
        id: "notepad",
        title: "Notepad",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        content: (
          <div className="p-4 h-full">
            <textarea
              className="w-full h-full resize-none p-2 font-mono text-black bg-white border-none focus:outline-none"
              defaultValue="Never Gonna Give You Up! Never Gonna Let you Down!"
            />
          </div>
        ),
        icon: "📝",
        position: { x: 150, y: 100 },
        zIndex: 9,
      },
      {
        id: "about",
        title: "About",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        content: (
          <div className="p-6 h-full flex flex-col items-center justify-center text-center">
            <div className="text-2xl mb-4">Simple OS and Snake Browser Game</div>
            <div className="mb-4">© 2025 Juan Carlos de Borja</div>
            <div className="text-sm mb-6">
              This is a nostalgic interface with the classic Snake game.
              <br />
              Click on desktop icons to open applications.
            </div>
            <button className="px-4 py-2 bg-blue-700 text-white rounded" onClick={() => closeWindow("about")}>
              OK
            </button>
          </div>
        ),
        icon: "ℹ️",
        position: { x: 200, y: 150 },
        zIndex: 8,
      },
    ])
  }, [])

  // Format time for taskbar
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Open a window
  const openWindow = (id: string) => {
    setStartMenuOpen(false)

    setWindows((prev) =>
      prev.map((window) => {
        if (window.id === id) {
          const newZIndex = highestZIndex + 1
          setHighestZIndex(newZIndex)

          return {
            ...window,
            isOpen: true,
            isMinimized: false,
            zIndex: newZIndex,
          }
        }
        return window
      }),
    )

    setActiveWindow(id)
  }

  // Close a window
  const closeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? {
              ...window,
              isOpen: false,
              isMinimized: false,
              isMaximized: false,
            }
          : window,
      ),
    )

    if (activeWindow === id) {
      setActiveWindow(null)
    }
  }

  // Minimize a window
  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? {
              ...window,
              isMinimized: true,
            }
          : window,
      ),
    )
  }

  // Maximize or restore a window
  const toggleMaximize = (id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? {
              ...window,
              isMaximized: !window.isMaximized,
            }
          : window,
      ),
    )
  }

  // Bring window to front
  const bringToFront = (id: string) => {
    if (activeWindow === id) return

    const newZIndex = highestZIndex + 1
    setHighestZIndex(newZIndex)

    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? {
              ...window,
              zIndex: newZIndex,
            }
          : window,
      ),
    )

    setActiveWindow(id)
  }

  // Start dragging a window
  const startDrag = (e: React.MouseEvent<HTMLDivElement>, id: string, position: WindowPosition) => {
    if (windows.find((w) => w.id === id)?.isMaximized) return

    setIsDragging(true)
    setActiveWindow(id)
    bringToFront(id)

    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  // Handle mouse move during drag
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !activeWindow) return

    setWindows((prev) =>
      prev.map((window) =>
        window.id === activeWindow
          ? {
              ...window,
              position: {
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
              },
            }
          : window,
      ),
    )
  }

  // End dragging
  const endDrag = () => {
    setIsDragging(false)
  }

  // Toggle start menu
  const toggleStartMenu = () => {
    setStartMenuOpen((prev) => !prev)
  }

  return (
    <div
      className="w-screen h-screen relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/winxp-bliss.png')",
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onClick={() => startMenuOpen && setStartMenuOpen(false)}
    >
      {/* Desktop Icons */}
      <div className="p-4 grid grid-cols-1 gap-6">
        {windows.map((window) => (
          <div
            key={`icon-${window.id}`}
            className="flex flex-col items-center justify-center w-20 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation()
              openWindow(window.id)
            }}
          >
            <div className="text-4xl mb-1">{window.icon}</div>
            <div className="text-center text-white text-sm font-semibold px-1 py-0.5 rounded group-hover:bg-blue-700/40">
              {window.title}
            </div>
          </div>
        ))}
      </div>

      {/* Windows */}
      {windows.map(
        (window) =>
          window.isOpen &&
          !window.isMinimized && (
            <div
              key={`window-${window.id}`}
              className={`absolute bg-gray-100 rounded-t shadow-xl overflow-hidden flex flex-col ${
                window.isMaximized ? "w-full h-[calc(100%-40px)] top-0 left-0" : "w-[500px] h-[400px]"
              }`}
              style={{
                left: window.isMaximized ? 0 : window.position.x,
                top: window.isMaximized ? 0 : window.position.y,
                zIndex: window.zIndex,
              }}
              onClick={() => bringToFront(window.id)}
            >
              {/* Window Title Bar */}
              <div
                className={`h-8 ${
                  activeWindow === window.id ? "bg-gradient-to-r from-blue-700 to-blue-500" : "bg-gray-400"
                } flex items-center justify-between px-2 cursor-grab`}
                onMouseDown={(e) => startDrag(e, window.id, window.position)}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{window.icon}</span>
                  <span className={`font-semibold ${activeWindow === window.id ? "text-white" : "text-gray-700"}`}>
                    {window.title}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      minimizeWindow(window.id)
                    }}
                  >
                    <Minus size={14} className={activeWindow === window.id ? "text-white" : "text-gray-700"} />
                  </button>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMaximize(window.id)
                    }}
                  >
                    <Square size={12} className={activeWindow === window.id ? "text-white" : "text-gray-700"} />
                  </button>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeWindow(window.id)
                    }}
                  >
                    <X size={14} className={activeWindow === window.id ? "text-white" : "text-gray-700"} />
                  </button>
                </div>
              </div>

              {/* Window Menu Bar */}
              <div className="h-6 bg-gray-200 border-b border-gray-300 flex items-center px-2 text-xs text-gray-700">
                <div className="mr-4 hover:underline cursor-pointer">File</div>
                <div className="mr-4 hover:underline cursor-pointer">Edit</div>
                <div className="mr-4 hover:underline cursor-pointer">View</div>
                <div className="mr-4 hover:underline cursor-pointer">Help</div>
              </div>

              {/* Window Content */}
              <div className="flex-1 overflow-auto bg-white">{window.content}</div>

              {/* Window Status Bar */}
              <div className="h-5 bg-gray-200 border-t border-gray-300 flex items-center justify-between px-2 text-xs text-gray-700">
                <div>Ready</div>
              </div>
            </div>
          ),
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-r from-blue-800 to-blue-600 flex items-center justify-between px-1 z-50">
        {/* Start Button */}
        <button
          className={`h-8 px-2 flex items-center rounded ${startMenuOpen ? "bg-blue-900" : "hover:bg-blue-700"}`}
          onClick={(e) => {
            e.stopPropagation()
            toggleStartMenu()
          }}
        >
          <div className="w-6 h-6 mr-1 flex items-center justify-center bg-green-500 rounded-full text-white font-bold">
            W
          </div>
          <span className="font-bold text-white">Start</span>
        </button>

        {/* Open Windows */}
        <div className="flex-1 flex items-center px-2 space-x-1 overflow-x-auto">
          {windows
            .filter((window) => window.isOpen)
            .map((window) => (
              <button
                key={`taskbar-${window.id}`}
                className={`h-7 px-2 flex items-center rounded-sm min-w-[120px] max-w-[200px] ${
                  activeWindow === window.id && !window.isMinimized ? "bg-gray-300/30" : "hover:bg-gray-300/20"
                }`}
                onClick={() => {
                  if (window.isMinimized) {
                    setWindows((prev) => prev.map((w) => (w.id === window.id ? { ...w, isMinimized: false } : w)))
                    bringToFront(window.id)
                  } else if (activeWindow === window.id) {
                    minimizeWindow(window.id)
                  } else {
                    bringToFront(window.id)
                  }
                }}
              >
                <span className="text-lg mr-2">{window.icon}</span>
                <span className="text-white text-sm truncate">{window.title}</span>
              </button>
            ))}
        </div>

        {/* System Tray */}
        <div className="flex items-center h-full">
          <div className="flex items-center bg-blue-700 h-full px-2">
            <Volume2 size={14} className="text-white mr-2" />
            <div className="text-white text-sm">{formatTime(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Start Menu */}
      {startMenuOpen && (
        <div
          className="absolute bottom-10 left-0 w-80 bg-white rounded-t-lg overflow-hidden z-50 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Banner */}
          <div className="h-16 bg-gradient-to-r from-blue-800 to-blue-600 flex items-center px-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl mr-3">👤</div>
            <div className="text-white font-semibold">User</div>
          </div>

          {/* Menu Items */}
          <div className="flex">
            <div className="w-3/5 p-2">
              {windows.map((window) => (
                <div
                  key={`menu-${window.id}`}
                  className="flex items-center p-2 hover:bg-blue-100 hover:text-blue-800 cursor-pointer rounded"
                  onClick={() => openWindow(window.id)}
                >
                  <div className="text-2xl mr-3">{window.icon}</div>
                  <div>{window.title}</div>
                </div>
              ))}
              <div className="border-t border-gray-300 my-2"></div>
              <div className="flex items-center p-2 hover:bg-blue-100 hover:text-blue-800 cursor-pointer rounded">
                <div className="text-2xl mr-3">⚙️</div>
                <div>Control Panel</div>
              </div>
            </div>
            <div className="w-2/5 bg-gray-100 p-2">
              <div className="text-xs font-semibold text-blue-800 mb-2">System</div>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-xs hover:text-blue-800 cursor-pointer">
                  <div className="text-lg mr-1">🔒</div>
                  <div>Lock</div>
                </div>
                <div className="flex items-center text-xs hover:text-blue-800 cursor-pointer">
                  <div className="text-lg mr-1">⭕</div>
                  <div>Shut Down</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
