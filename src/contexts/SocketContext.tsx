import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { socketService } from '../services/socket'
import { GameState, RoomState, Player, RoomSettings } from '../types/room'

type SocketAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_CURRENT_PLAYER'; payload: Player }
  | { type: 'SET_ROOM'; payload: RoomState }
  | { type: 'LEAVE_ROOM' }
  | { type: 'SET_SHOW_JOIN_DIALOG'; payload: boolean }
  | { type: 'SET_JOIN_ROOM_ID'; payload: string }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'SET_ROOM_SETTINGS'; payload: RoomSettings }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'SET_ROOM_DESTROYED'; payload: boolean }

const initialState: GameState = {
  currentView: 'menu',
  roomId: null,
  currentPlayer: null,
  room: null,
  isConnected: false,
  showJoinDialog: false,
  joinRoomId: '',
  playerName: `玩家${Math.floor(Math.random() * 1000)}`,
  roomDestroyed: false
}

function socketReducer(state: GameState, action: SocketAction): GameState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload }
    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayer: action.payload,
        playerName: action.payload.name
      }
    case 'SET_ROOM':
      return {
        ...state,
        room: action.payload,
        roomId: action.payload.id,
        currentView: 'room',
        showJoinDialog: false
      }
    case 'LEAVE_ROOM':
      return {
        ...state,
        currentView: 'menu',
        room: null,
        roomId: null,
        currentPlayer: state.currentPlayer, // 保留玩家信息
        roomDestroyed: false // 重置房间销毁状态
      }
    case 'SET_SHOW_JOIN_DIALOG':
      return { ...state, showJoinDialog: action.payload }
    case 'SET_JOIN_ROOM_ID':
      return { ...state, joinRoomId: action.payload }
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload }
    case 'SET_ROOM_SETTINGS':
      return {
        ...state,
        room: state.room ? { ...state.room, settings: action.payload } : null
      }
    case 'TOGGLE_SETTINGS':
      return {
        ...state,
        room: state.room ? { ...state.room, showSettings: !state.room.showSettings } : null
      }
    case 'SET_ROOM_DESTROYED':
      return {
        ...state,
        roomDestroyed: action.payload,
        room: null,
        roomId: null,
        currentView: 'menu'
      }
    default:
      return state
  }
}

interface SocketContextType {
  gameState: GameState
  createRoom: () => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  startGame: () => void
  updateRoomSettings: (settings: RoomSettings) => void
  toggleSettings: () => void
  updatePlayerName: (name: string) => void
  refreshRoom: () => void
  setJoinRoomId: (roomId: string) => void
  showJoinDialog: () => void
  hideJoinDialog: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [gameState, dispatch] = useReducer(socketReducer, initialState)

  useEffect(() => {
    socketService.connect()

    const handleConnectionChange = (isConnected: boolean) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected })
    }

    const handleRoomCreated = ({ roomId, player }: { roomId: string; player: Player }) => {
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: player })
      dispatch({ type: 'SET_ROOM', payload: { id: roomId, players: [player] } as RoomState })
      // 这里会自动触发路由跳转
    }

    const handleRoomJoined = ({ room, player }: { room: RoomState; player: Player }) => {
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: player })
      dispatch({ type: 'SET_ROOM', payload: room })
    }

    const handleRoomJoinFailed = (_reason: string) => {
      // Toast通知会在页面级别处理，这里只是更新状态
      dispatch({ type: 'SET_SHOW_JOIN_DIALOG', payload: false })
    }

    const handlePlayerJoined = (player: Player) => {
      if (gameState.room) {
        // 检查玩家是否已经存在（基于socketId或userId）
        const existingPlayerIndex = gameState.room.players.findIndex(p =>
          p.socketId === player.socketId || p.id === player.id
        )

        let updatedRoom
        if (existingPlayerIndex >= 0) {
          // 如果玩家已存在，更新其信息（处理重新连接的情况）
          const updatedPlayers = [...gameState.room.players]
          updatedPlayers[existingPlayerIndex] = player
          updatedRoom = {
            ...gameState.room,
            players: updatedPlayers
          }
        } else {
          // 如果玩家不存在，添加新玩家
          updatedRoom = {
            ...gameState.room,
            players: [...gameState.room.players, player]
          }
        }

        dispatch({ type: 'SET_ROOM', payload: updatedRoom })
      }
    }

    const handlePlayerLeft = (playerId: string) => {
      if (gameState.room) {
        const updatedRoom = {
          ...gameState.room,
          players: gameState.room.players.filter(p => p.id !== playerId)
        }
        dispatch({ type: 'SET_ROOM', payload: updatedRoom })
      }
    }

    const handleRoomUpdated = (room: RoomState) => {
      dispatch({ type: 'SET_ROOM', payload: room })
    }

    const handleGameStarted = ({ redTeamHeroes, blueTeamHeroes, gameCount }: { redTeamHeroes: string[]; blueTeamHeroes: string[]; gameCount: number }) => {
      if (gameState.room) {
        const updatedRoom = {
          ...gameState.room,
          redTeamHeroes,
          blueTeamHeroes,
          gameCount,
          isRolling: false
        }
        dispatch({ type: 'SET_ROOM', payload: updatedRoom })
      }
    }

    const handleRoomDestroyed = () => {
      dispatch({ type: 'SET_ROOM_DESTROYED', payload: true })
    }

    const handleError = (message: string) => {
      alert(`错误: ${message}`)
    }

    // 注册事件监听器
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
      socketService.disconnect()
    }
  }, [])

  const createRoom = () => {
    socketService.createRoom()
  }

  const joinRoom = (roomId: string) => {
    if (roomId.trim()) {
      socketService.joinRoom(roomId.trim())
    }
  }

  const leaveRoom = () => {
    socketService.leaveRoom()
    dispatch({ type: 'LEAVE_ROOM' })
  }

  const startGame = () => {
    if (gameState.room && !gameState.room.isRolling && gameState.room.players.length >= 2) {
      if (gameState.room) {
        const updatedRoom = { ...gameState.room, isRolling: true }
        dispatch({ type: 'SET_ROOM', payload: updatedRoom })
      }
      socketService.startGame()
    }
  }

  const updateRoomSettings = (settings: RoomSettings) => {
    socketService.updateSettings(settings)
  }

  const toggleSettings = () => {
    dispatch({ type: 'TOGGLE_SETTINGS' })
  }

  const updatePlayerName = (name: string) => {
    dispatch({ type: 'SET_PLAYER_NAME', payload: name })
    socketService.setPlayerName(name)
  }

  const setJoinRoomId = (roomId: string) => {
    dispatch({ type: 'SET_JOIN_ROOM_ID', payload: roomId })
  }

  const showJoinDialog = () => {
    dispatch({ type: 'SET_SHOW_JOIN_DIALOG', payload: true })
  }

  const hideJoinDialog = () => {
    dispatch({ type: 'SET_SHOW_JOIN_DIALOG', payload: false })
    dispatch({ type: 'SET_JOIN_ROOM_ID', payload: '' })
  }

  const refreshRoom = () => {
    socketService.refreshRoom()
  }

  return (
    <SocketContext.Provider value={{
      gameState,
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      updateRoomSettings,
      toggleSettings,
      updatePlayerName,
      refreshRoom,
      setJoinRoomId,
      showJoinDialog,
      hideJoinDialog
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocketContext() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}