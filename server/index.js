import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const app = express()
const server = createServer(app)

// CORS配置
const isDevelopment = process.env.NODE_ENV !== 'production'
app.use(cors({
  origin: isDevelopment
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173']
    : ['https://your-domain.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}))

const io = new Server(server, {
  cors: {
    origin: isDevelopment
      ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173']
      : ['https://your-domain.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// 房间管理
const rooms = new Map()
const playerSockets = new Map() // socketId -> { playerId, roomId }
const userSessions = new Map() // 用户会话管理，用于识别同一用户
const userInfo = new Map() // 用户信息存储，用于持久化用户名称

// 生成32位房间ID
function generateRoomId() {
  return uuidv4().replace(/-/g, '')
}

// 生成用户唯一标识
function generateUserId(ip, userAgent) {
  // 使用IP和User-Agent的组合来生成用户ID，这样同一浏览器会得到相同的ID
  const hash = crypto.createHash('md5')
  hash.update(`${ip}:${userAgent}`)
  return hash.digest('hex').substring(0, 32)
}

// 获取英雄数据（这里先用简化的英雄列表）
const heroes = [
  '盖伦', '拉克丝', '安妮', '艾希', '易大师', '瑞兹', '阿狸', '嘉文四世',
  '卡特琳娜', '凯特琳', '德莱文', '金克丝', '李青', '赵信', '亚索', '永恩',
  '劫', '慎', '凯南', '艾克', '菲奥娜', '剑魔', '鳄鱼', '石头人', '狗头',
  '剑圣', '武器大师', '发条', '辛德拉', '维克托', '卡萨丁', '小鱼人', '卡牌',
  '泰隆', '男刀', '女警', 'vn', '大嘴', '老鼠', '小炮', '烬', '泽丽', '莎弥拉',
  '辅助锤石', '机器人', '莫甘娜', '蕾欧娜', '娜美', '璐璐', '巴德', '塔姆',
  '诺手', '俄洛伊', '塞拉斯', '阿克尚', '格温', '佛耶戈', '莉莉娅', '莉莉娅',
  '奥拉夫', '瑟提', '腕豪', '厄斐琉斯', '霞', '洛', '潘森', '奎桑提', '米利欧'
]

// 随机选择英雄
function getRandomHeroes(count, excludeHeroes = []) {
  const availableHeroes = heroes.filter(hero => !excludeHeroes.includes(hero))
  const shuffled = [...availableHeroes].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// 清理空房间
function cleanupEmptyRooms() {
  const now = Date.now()
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 0 || (now - room.lastActivityAt > 180000)) {
      // 通知房间内的所有玩家房间被销毁
      room.players.forEach(player => {
        const socket = io.sockets.sockets.get(player.socketId)
        if (socket) {
          socket.emit('room-destroyed')
        }
      })
      rooms.delete(roomId)
      console.log(`房间 ${roomId} 已销毁`)
    }
  }
}

// 每30秒检查一次空房间（房间3分钟无活动后销毁）
setInterval(cleanupEmptyRooms, 30000)

// Socket.IO连接处理
io.on('connection', (socket) => {
  const clientIP = socket.handshake.address || socket.conn.remoteAddress
  const userAgent = socket.handshake.headers['user-agent'] || 'unknown'
  const userId = generateUserId(clientIP, userAgent)

  console.log(`用户连接: ${socket.id}, IP: ${clientIP}, 用户ID: ${userId}`)

  // 检查用户是否已在其他房间中
  const existingSession = userSessions.get(userId)
  if (existingSession) {
    // 如果用户已在其他房间，先清理之前的连接
    const { socketId: oldSocketId, roomId: oldRoomId } = existingSession
    console.log(`用户 ${userId} 重新连接，清理之前的连接 ${oldSocketId}`)

    // 从之前的房间中移除玩家
    const oldRoom = rooms.get(oldRoomId)
    if (oldRoom) {
      oldRoom.players = oldRoom.players.filter(p => p.socketId !== oldSocketId)
      if (oldRoom.players.length === 0) {
        rooms.delete(oldRoomId)
      } else {
        // 通知房间内其他玩家
        socket.to(oldRoomId).emit('player-left', userId)
      }
    }

    // 清理旧的socket映射
    playerSockets.delete(oldSocketId)
  }

  // 记录新的用户会话
  userSessions.set(userId, { socketId: socket.id, roomId: null })

  // 设置玩家名称事件
  socket.on('set-player-name', (name) => {
    // 保存用户名称
    userInfo.set(userId, { name, lastUpdated: Date.now() })
    console.log(`用户 ${userId} 设置名称为: ${name}`)

    // 如果用户在房间中，更新房间内的玩家名称
    const session = userSessions.get(userId)
    if (session && session.roomId) {
      const room = rooms.get(session.roomId)
      if (room) {
        const player = room.players.find(p => p.id === userId)
        if (player) {
          player.name = name
          room.lastActivityAt = Date.now()
          // 通知房间内所有玩家
          io.to(session.roomId).emit('room-updated', room)
        }
      }
    }
  })

  // 创建房间
  socket.on('create-room', () => {
    const roomId = generateRoomId()

    // 获取用户名称，如果已设置则使用，否则使用默认名称
    const savedUserInfo = userInfo.get(userId)
    const playerName = savedUserInfo?.name || `玩家${Math.floor(Math.random() * 1000)}`

    const player = {
      id: userId, // 使用基于IP和User-Agent的固定用户ID
      name: playerName,
      team: 'red',
      socketId: socket.id
    }

    const room = {
      id: roomId,
      ownerId: player.id,
      players: [player],
      settings: {
        blueCount: 20,
        redCount: 20,
        balanceByRole: false
      },
      redTeamHeroes: [],
      blueTeamHeroes: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      isRolling: false,
      gameCount: 0,
      showSettings: false
    }

    rooms.set(roomId, room)
    playerSockets.set(socket.id, { playerId: player.id, roomId })

    // 更新用户会话
    userSessions.set(userId, { socketId: socket.id, roomId })

    socket.join(roomId)
    socket.emit('room-created', { roomId, player })
    console.log(`房间 ${roomId} 已创建，玩家 ${player.name}（用户ID: ${player.id}）加入（房主）`)
  })

  // 加入房间
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId)

    if (!room) {
      socket.emit('room-join-failed', '房间不存在')
      return
    }

    if (room.players.length >= 2) {
      socket.emit('room-join-failed', '房间已满')
      return
    }

    // 检查用户是否已在房间中
    if (room.players.some(p => p.id === userId)) {
      socket.emit('room-join-failed', '您已在此房间中')
      return
    }

    // 分配队伍
    const team = room.players[0]?.team === 'red' ? 'blue' : 'red'

    // 获取用户名称，如果已设置则使用，否则使用默认名称
    const savedUserInfo = userInfo.get(userId)
    const playerName = savedUserInfo?.name || `玩家${Math.floor(Math.random() * 1000)}`

    const player = {
      id: userId, // 使用基于IP和User-Agent的固定用户ID
      name: playerName,
      team,
      socketId: socket.id
    }

    room.players.push(player)
    room.lastActivityAt = Date.now()

    playerSockets.set(socket.id, { playerId: player.id, roomId })

    // 更新用户会话
    userSessions.set(userId, { socketId: socket.id, roomId })

    socket.join(roomId)
    socket.emit('room-joined', { room, player })

    // 通知房间内其他玩家
    socket.to(roomId).emit('player-joined', player)

    console.log(`玩家 ${player.name}（用户ID: ${player.id}）加入房间 ${roomId}，分配到 ${team} 队`)
  })

  // 离开房间
  socket.on('leave-room', () => {
    const playerInfo = playerSockets.get(socket.id)
    if (!playerInfo) return

    const { playerId, roomId } = playerInfo
    const room = rooms.get(roomId)

    if (room) {
      room.players = room.players.filter(p => p.id !== playerId)
      room.lastActivityAt = Date.now()

      // 通知房间内其他玩家
      socket.to(roomId).emit('player-left', playerId)
      socket.to(roomId).emit('room-updated', room)

      console.log(`玩家 ${playerId}（用户ID: ${userId}）离开房间 ${roomId}`)
    }

    socket.leave(roomId)
    playerSockets.delete(socket.id)

    // 更新用户会话
    userSessions.set(userId, { socketId: socket.id, roomId: null })
  })

  // 开始游戏
  socket.on('start-game', () => {
    const playerInfo = playerSockets.get(socket.id)
    if (!playerInfo) return

    const { playerId, roomId } = playerInfo
    const room = rooms.get(roomId)

    // 检查是否是房主
    if (!room || room.ownerId !== playerId) {
      socket.emit('error', '只有房主可以开始游戏')
      return
    }

    if (room.isRolling || room.players.length < 2) return

    room.isRolling = true
    room.gameCount = (room.gameCount || 0) + 1
    room.lastActivityAt = Date.now()

    // 通知所有玩家开始游戏
    io.to(roomId).emit('room-updated', room)

    // 模拟随机分配动画
    setTimeout(() => {
      const redTeamHeroes = getRandomHeroes(room.settings.redCount, [])
      const blueTeamHeroes = getRandomHeroes(room.settings.blueCount, [...redTeamHeroes])

      room.redTeamHeroes = redTeamHeroes
      room.blueTeamHeroes = blueTeamHeroes
      room.isRolling = false
      room.lastActivityAt = Date.now()

      // 通知所有玩家结果
      io.to(roomId).emit('game-started', {
        redTeamHeroes,
        blueTeamHeroes,
        gameCount: room.gameCount
      })
      io.to(roomId).emit('room-updated', room)

      console.log(`房间 ${roomId} 第 ${room.gameCount} 盘游戏开始`)
    }, 2000) // 2秒动画时间
  })

  // 更新房间设置
  socket.on('update-settings', (settings) => {
    const playerInfo = playerSockets.get(socket.id)
    if (!playerInfo) return

    const { playerId, roomId } = playerInfo
    const room = rooms.get(roomId)

    // 检查是否是房主
    if (!room || room.ownerId !== playerId) {
      socket.emit('error', '只有房主可以修改设置')
      return
    }

    // 更新设置
    room.settings = { ...room.settings, ...settings }
    room.lastActivityAt = Date.now()

    // 通知所有玩家设置已更新
    io.to(roomId).emit('room-updated', room)

    console.log(`房间 ${roomId} 设置已更新`, room.settings)
  })

  // 设置玩家名称
  socket.on('set-player-name', (name) => {
    const playerInfo = playerSockets.get(socket.id)
    if (!playerInfo) return

    const { playerId, roomId } = playerInfo
    const room = rooms.get(roomId)

    if (room) {
      const player = room.players.find(p => p.id === playerId)
      if (player) {
        player.name = name
        room.lastActivityAt = Date.now()

        // 通知房间内所有玩家
        io.to(roomId).emit('room-updated', room)
      }
    }
  })

  // 刷新房间状态
  socket.on('refresh-room', () => {
    const playerInfo = playerSockets.get(socket.id)
    if (!playerInfo) return

    const { playerId, roomId } = playerInfo
    const room = rooms.get(roomId)

    if (room) {
      // 更新房间活动时间
      room.lastActivityAt = Date.now()

      // 向请求刷新的玩家发送最新房间状态
      socket.emit('room-updated', room)

      console.log(`玩家 ${playerId} 请求刷新房间 ${roomId} 状态`)
    }
  })

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户断开连接: ${socket.id}, 用户ID: ${userId}`)

    const playerInfo = playerSockets.get(socket.id)
    if (playerInfo) {
      const { playerId, roomId } = playerInfo
      const room = rooms.get(roomId)

      if (room) {
        room.players = room.players.filter(p => p.id !== playerId)
        room.lastActivityAt = Date.now()

        // 通知房间内其他玩家
        socket.to(roomId).emit('player-left', playerId)
        socket.to(roomId).emit('room-updated', room)

        console.log(`玩家 ${playerId}（用户ID: ${userId}）断开连接`)
      }

      playerSockets.delete(socket.id)
    }

    // 清理用户会话
    userSessions.delete(userId)
  })
})

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: playerSockets.size,
    timestamp: new Date().toISOString()
  })
})

// 获取房间信息
app.get('/room/:roomId', (req, res) => {
  const { roomId } = req.params
  const room = rooms.get(roomId)

  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }

  res.json({
    id: room.id,
    playerCount: room.players.length,
    maxPlayers: 2,
    createdAt: room.createdAt,
    lastActivityAt: room.lastActivityAt
  })
})

const PORT = process.env.PORT || 3010

server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/health`)
})