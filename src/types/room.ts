export enum Team {
  RED = 'red',
  BLUE = 'blue'
}

export interface Player {
  id: string
  name: string
  team: Team
  socketId: string
}

export interface RoomSettings {
  blueCount: number
  redCount: number
  balanceByRole: boolean
}

export interface RoomState {
  id: string
  players: Player[]
  ownerId: string // 房主ID
  settings: RoomSettings
  redTeamHeroes: string[]
  blueTeamHeroes: string[]
  createdAt: number
  lastActivityAt: number
  isRolling: boolean
  gameCount: number // 游戏局数
  showSettings: boolean // 是否显示设置页面
}

export interface RoomEvents {
  // 客户端发送的事件
  'create-room': () => void
  'join-room': (roomId: string) => void
  'leave-room': () => void
  'start-game': () => void
  'update-settings': (settings: RoomSettings) => void
  'set-player-name': (name: string) => void
  'refresh-room': () => void

  // 服务器发送的事件
  'room-created': (data: { roomId: string; player: Player }) => void
  'room-joined': (data: { room: RoomState; player: Player }) => void
  'room-join-failed': (reason: string) => void
  'player-joined': (player: Player) => void
  'player-left': (playerId: string) => void
  'room-updated': (room: RoomState) => void
  'game-started': (data: { redTeamHeroes: string[]; blueTeamHeroes: string[]; gameCount: number }) => void
  'room-destroyed': () => void
  'error': (message: string) => void
}

export interface GameState {
  currentView: 'menu' | 'room'
  roomId: string | null
  currentPlayer: Player | null
  room: RoomState | null
  isConnected: boolean
  showJoinDialog: boolean
  joinRoomId: string
  playerName: string
  roomDestroyed: boolean
}