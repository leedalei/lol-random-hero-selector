import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSocketContext } from '../contexts/SocketContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from 'sonner'
import { useToast } from '@/hooks/use-toast'

export default function HomePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { gameState, createRoom, showJoinDialog, hideJoinDialog, joinRoom, setJoinRoomId, updatePlayerName } = useSocketContext()

  const handleJoinRoom = (roomId: string) => {
    if (roomId.trim()) {
      joinRoom(roomId)
    }
  }

  const handleOfflineMode = () => {
    navigate('/offline')
  }

  // 监听房间状态变化，自动导航
  useEffect(() => {
    if (gameState.roomId && gameState.currentView === 'room' && gameState.currentPlayer) {
      navigate(`/room/${gameState.roomId}`)
    }
  }, [gameState.roomId, gameState.currentView, gameState.currentPlayer, navigate])

  const handleJoinRoomClick = () => {
    handleJoinRoom(gameState.joinRoomId)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" />
      {/* 顶部标题区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-2xl">
          <div>
            <h1 className="text-6xl font-bold mb-4 flex items-center justify-center space-x-4">
              <span className="text-5xl">⚔️</span>
              <span>LOL 随机英雄</span>
            </h1>
            <p className="text-xl text-muted-foreground flex items-center justify-center space-x-2">
              <span>🎮</span>
              <span>在线联机对战版</span>
            </p>
          </div>

          {/* 用户信息 */}
          <Card className="max-w-md mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                  👤
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">用户ID</p>
                  <p className="font-mono text-xs">{gameState.currentPlayer?.id || '未连接'}</p>
                  <p className="text-sm mt-1">{gameState.playerName}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 用户名称输入 */}
              <div className="space-y-4">
                <Label htmlFor="username" className="text-left">修改名称</Label>
                <div className="flex space-x-2">
                  <Input
                    id="username"
                    type="text"
                    value={gameState.playerName}
                    onChange={(e) => updatePlayerName(e.target.value)}
                    placeholder="输入你的名称"
                  />
                  <Button
                    onClick={() => {
                      if (gameState.playerName.trim()) {
                        updatePlayerName(gameState.playerName)
                        toast({
                          message: '用户名称已更新',
                          type: 'success',
                          duration: 2000
                        })
                      }
                    }}
                  >
                    保存
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-left">* 名称会保存在当前浏览器中</p>
              </div>
            </CardContent>
          </Card>

          {/* 连接状态 */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${gameState.isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="flex items-center space-x-2">
              <span>{gameState.isConnected ? '🟢' : '🔴'}</span>
              <span className="text-muted-foreground">{gameState.isConnected ? '已连接到服务器' : '正在连接服务器...'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 底部按钮区域 */}
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <Button
            onClick={createRoom}
            disabled={!gameState.isConnected}
            size="lg"
            className="w-full text-lg font-semibold"
          >
            🏠 创建房间
          </Button>

          <Button
            onClick={showJoinDialog}
            disabled={!gameState.isConnected}
            variant="secondary"
            size="lg"
            className="w-full text-lg font-semibold"
          >
            🚪 加入房间
          </Button>

          <Button
            onClick={handleOfflineMode}
            variant="outline"
            size="lg"
            className="w-full text-lg font-semibold"
          >
            🎯 单机模式
          </Button>
        </div>

        {/* 游戏说明 */}
        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <span className="text-2xl">📋</span>
              <span>游戏说明</span>
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">•</span>
                <span>每个房间最多2名玩家，自动分配红蓝两队</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>只有房主可以开始游戏，设置队伍参数</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>点击开始后每位玩家只能看到自己队伍的英雄</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>房间空闲3分钟自动销毁</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 加入房间对话框 */}
      {gameState.showJoinDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center space-x-3">
                <span className="text-3xl">🚪</span>
                <span>加入房间</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="roomId" className="text-sm font-medium">房间ID</Label>
                <Input
                  id="roomId"
                  type="text"
                  value={gameState.joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="请输入32位房间ID"
                  className="font-mono"
                  maxLength={32}
                />
                <p className="text-xs text-muted-foreground">房间ID为32位字符</p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleJoinRoomClick}
                  disabled={!gameState.joinRoomId.trim()}
                  className="flex-1"
                >
                  加入房间
                </Button>
                <Button
                  onClick={hideJoinDialog}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}