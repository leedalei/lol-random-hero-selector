import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// 模拟房间数据存储 (实际生产环境应使用数据库)
let rooms = new Map();
let userSessions = new Map();

// 生成32位房间ID
function generateRoomId() {
  return uuidv4().replace(/-/g, '');
}

// 生成用户唯一标识
function generateUserId(ip, userAgent) {
  const hash = crypto.createHash('md5');
  hash.update(`${ip}:${userAgent}`);
  return hash.digest('hex').substring(0, 32);
}

export default async function handler(req, res) {
  // CORS处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      return res.status(200).json({
        status: 'ok',
        rooms: rooms.size,
        players: userSessions.size,
        timestamp: new Date().toISOString(),
        service: 'vercel-serverless'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}