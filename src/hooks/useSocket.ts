import { useEffect, useState, useCallback } from 'react'
import { socketService } from '../services/socket'
import { GameState, RoomState, Player, RoomSettings } from '../types/room'

export function useSocket() {
  const [gameState, setGameState] = useState<GameState>({
    currentView: 'menu',
    roomId: null,
    currentPlayer: null,
    room: null,
    isConnected: false,
    showJoinDialog: false,
    joinRoomId: '',
    playerName: `玩家${Math.floor(Math.random() * 1000)}`,
    roomDestroyed: false
  })

  // 初始化Socket连接
  useEffect(() => {
    socketService.connect()

    return () => {
      socketService.disconnect()
    }
  }, [])

  // 注册Socket事件监听器
  useEffect(() => {
    const handleConnectionChange = (isConnected: boolean) => {
      setGameState(prev => ({ ...prev, isConnected }))
    }

    const handleRoomCreated = ({ roomId, player }: { roomId: string; player: Player }) => {
      setGameState(prev => ({
        ...prev,
        currentView: 'room',
        roomId,
        currentPlayer: player,
        showJoinDialog: false
      }))
    }

    const handleRoomJoined = ({ room, player }: { room: RoomState; player: Player }) => {
      setGameState(prev => ({
        ...prev,
        currentView: 'room',
        roomId: room.id,
        room,
        currentPlayer: player,
        showJoinDialog: false
      }))
    }

    const handleRoomJoinFailed = (reason: string) => {
      alert(`加入房间失败: ${reason}`)
      setGameState(prev => ({ ...prev, showJoinDialog: false }))
    }

    const handlePlayerJoined = (player: Player) => {
      setGameState(prev => {
        if (!prev.room) return prev
        return {
          ...prev,
          room: {
            ...prev.room,
            players: [...prev.room.players, player]
          }
        }
      })
    }

    const handlePlayerLeft = (playerId: string) => {
      setGameState(prev => {
        if (!prev.room) return prev
        return {
          ...prev,
          room: {
            ...prev.room,
            players: prev.room.players.filter(p => p.id !== playerId)
          }
        }
      })
    }

    const handleRoomUpdated = (room: RoomState) => {
      setGameState(prev => ({ ...prev, room }))
    }

    const handleGameStarted = ({ redTeamHeroes, blueTeamHeroes, gameCount }: { redTeamHeroes: string[]; blueTeamHeroes: string[]; gameCount: number }) => {
      setGameState(prev => {
        if (!prev.room) return prev
        return {
          ...prev,
          room: {
            ...prev.room,
            redTeamHeroes,
            blueTeamHeroes,
            gameCount,
            isRolling: false
          }
        }
      })
    }

    const handleRoomDestroyed = () => {
      setGameState(prev => ({
        ...prev,
        currentView: 'menu',
        roomId: null,
        room: null,
        currentPlayer: null
      }))
      alert('房间已被销毁')
    }

    const handleError = (message: string) => {
      alert(`错误: ${message}`)
    }

    // 注册所有事件监听器
    socketService.on('connection-change', handleConnectionChange)
    socketService.on('room-created', handleRoomCreated)
    socketService.on('room-joined', handleRoomJoined)
    socketService.on('room-join-failed', handleRoomJoinFailed)
    socketService.on('player-joined', handlePlayerJoined)
    socketService.on('player-left', handlePlayerLeft)
    socketService.on('room-updated', handleRoomUpdated)
    socketService.on('game-started', handleGameStarted)
    socketService.on('room-destroyed', handleRoomDestroyed)
    socketService.on('error', handleError)

    return () => {
      socketService.off('connection-change', handleConnectionChange)
      socketService.off('room-created', handleRoomCreated)
      socketService.off('room-joined', handleRoomJoined)
      socketService.off('room-join-failed', handleRoomJoinFailed)
      socketService.off('player-joined', handlePlayerJoined)
      socketService.off('player-left', handlePlayerLeft)
      socketService.off('room-updated', handleRoomUpdated)
      socketService.off('game-started', handleGameStarted)
      socketService.off('room-destroyed', handleRoomDestroyed)
      socketService.off('error', handleError)
    }
  }, [])

  // 操作方法
  const createRoom = useCallback(() => {
    socketService.createRoom()
  }, [])

  const showJoinDialog = useCallback(() => {
    setGameState(prev => ({ ...prev, showJoinDialog: true }))
  }, [])

  const hideJoinDialog = useCallback(() => {
    setGameState(prev => ({ ...prev, showJoinDialog: false, joinRoomId: '' }))
  }, [])

  const joinRoom = useCallback((roomId: string) => {
    if (roomId.trim()) {
      socketService.joinRoom(roomId.trim())
    }
  }, [])

  const leaveRoom = useCallback(() => {
    socketService.leaveRoom()
  }, [])

  const startGame = useCallback(() => {
    if (gameState.room && !gameState.room.isRolling && gameState.room.players.length >= 2) {
      setGameState(prev => {
        if (!prev.room) return prev
        return {
          ...prev,
          room: { ...prev.room, isRolling: true }
        }
      })
      socketService.startGame()
    }
  }, [gameState.room])

  const updateRoomSettings = useCallback((settings: RoomSettings) => {
    socketService.updateSettings(settings)
  }, [])

  const toggleSettings = useCallback(() => {
    setGameState(prev => {
      if (!prev.room) return prev
      return {
        ...prev,
        room: { ...prev.room, showSettings: !prev.room.showSettings }
      }
    })
  }, [])

  const updatePlayerName = useCallback((name: string) => {
    setGameState(prev => ({ ...prev, playerName: name }))
    socketService.setPlayerName(name)
  }, [])

  const setJoinRoomId = useCallback((roomId: string) => {
    setGameState(prev => ({ ...prev, joinRoomId: roomId }))
  }, [])

  return {
    gameState,
    createRoom,
    showJoinDialog,
    hideJoinDialog,
    joinRoom,
    leaveRoom,
    startGame,
    updateRoomSettings,
    toggleSettings,
    updatePlayerName,
    setJoinRoomId
  }
}