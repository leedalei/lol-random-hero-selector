import { io, Socket } from 'socket.io-client'
import { RoomEvents } from '../types/room'

class SocketService {
  private socket: Socket<RoomEvents> | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect() {
    if (this.socket?.connected) return

    // 注意：这里使用本地开发服务器，部署时需要改为实际的服务器地址
    const serverUrl = import.meta.env.PROD
      ? 'wss://your-server-url.com'
      : 'ws://localhost:3010'

    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    })

    this.socket.on('connect', () => {
      console.log('已连接到服务器')
      this.emit('connection-change', true)
    })

    this.socket.on('disconnect', () => {
      console.log('与服务器的连接已断开')
      this.emit('connection-change', false)
    })

    this.socket.on('room-created', (data) => {
      this.emit('room-created', data)
    })

    this.socket.on('room-joined', (data) => {
      this.emit('room-joined', data)
    })

    this.socket.on('room-join-failed', (reason) => {
      this.emit('room-join-failed', reason)
    })

    this.socket.on('player-joined', (player) => {
      this.emit('player-joined', player)
    })

    this.socket.on('player-left', (playerId) => {
      this.emit('player-left', playerId)
    })

    this.socket.on('room-updated', (room) => {
      this.emit('room-updated', room)
    })

    this.socket.on('game-started', (data) => {
      this.emit('game-started', data)
    })

    this.socket.on('room-destroyed', () => {
      this.emit('room-destroyed')
    })

    this.socket.on('error', (message) => {
      this.emit('error', message)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private emit(event: string, ...args: any[]) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Socket事件处理器错误 [${event}]:`, error)
        }
      })
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  // 房间操作方法
  createRoom() {
    if (this.socket?.connected) {
      this.socket.emit('create-room')
    } else {
      console.error('未连接到服务器')
    }
  }

  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-room', roomId)
    } else {
      console.error('未连接到服务器')
    }
  }

  leaveRoom() {
    if (this.socket?.connected) {
      this.socket.emit('leave-room')
    }
  }

  startGame() {
    if (this.socket?.connected) {
      this.socket.emit('start-game')
    }
  }

  updateSettings(settings: any) {
    if (this.socket?.connected) {
      this.socket.emit('update-settings', settings)
    }
  }

  setPlayerName(name: string) {
    if (this.socket?.connected) {
      this.socket.emit('set-player-name', name)
    }
  }

  refreshRoom() {
    if (this.socket?.connected) {
      this.socket.emit('refresh-room')
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()