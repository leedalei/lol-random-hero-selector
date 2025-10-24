import { v4 as uuidv4 } from 'uuid';

// 模拟房间数据存储
let rooms = new Map();

// 生成32位房间ID
function generateRoomId() {
  return uuidv4().replace(/-/g, '');
}

// 房间数据结构
function createRoom(ownerId, ownerName) {
  const roomId = generateRoomId();
  const room = {
    id: roomId,
    ownerId: ownerId,
    players: [{
      id: ownerId,
      name: ownerName,
      team: 'blue',
      socketId: null
    }],
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
    gameCount: 1,
    showSettings: false
  };

  rooms.set(roomId, room);
  return room;
}

export default async function handler(req, res) {
  // CORS处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // 获取房间列表
        const roomList = Array.from(rooms.values()).map(room => ({
          id: room.id,
          playerCount: room.players.length,
          isRolling: room.isRolling,
          createdAt: room.createdAt
        }));
        return res.status(200).json({ rooms: roomList });

      case 'POST':
        // 创建房间
        const { ownerId, ownerName } = req.body;

        if (!ownerId || !ownerName) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['ownerId', 'ownerName']
          });
        }

        const newRoom = createRoom(ownerId, ownerName);
        return res.status(201).json({
          roomId: newRoom.id,
          room: newRoom
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Rooms API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}