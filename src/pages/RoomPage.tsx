import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSocketContext } from '../contexts/SocketContext'
import { Team, RoomSettings } from '../types/room'
import { Hero } from '../types/hero'
import { useToast } from '../hooks/use-toast'
import { Toaster } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw } from 'lucide-react'
import { heroes } from '../data/heroes'
import { getHeroAvatar } from '../utils/avatar'

// 添加复制功能
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    return false
  }
}

// 根据英雄名字查找Hero对象
const findHeroByName = (heroName: string): Hero | undefined => {
  return heroes.find(hero =>
    hero.name === heroName ||
    hero.alias === heroName ||
    hero.title === heroName
  )
}

// 英雄头像组件
const HeroAvatar = ({ heroName, className = "" }: { heroName: string; className?: string }) => {
  const [imageError, setImageError] = useState(false)
  const hero = findHeroByName(heroName)

  if (!hero || imageError) {
    // 降级显示：显示英雄名字首字母
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <span className="font-bold text-gray-600">
          {heroName.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <img
      src={getHeroAvatar(hero)}
      alt={hero.name}
      className={`${className} rounded-lg object-cover`}
      onError={() => setImageError(true)}
    />
  )
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { gameState, leaveRoom, startGame, updateRoomSettings, toggleSettings, joinRoom, refreshRoom } = useSocketContext()
  const { toast } = useToast()
  const [localSettings, setLocalSettings] = useState<RoomSettings>(
    gameState.room?.settings || {
      blueCount: 20,
      redCount: 20,
      balanceByRole: false
    }
  )
  const [copiedRoomId, setCopiedRoomId] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 如果有roomId但当前没有房间，尝试自动加入
  useEffect(() => {
    if (roomId && !gameState.room && gameState.isConnected) {
      console.log('尝试自动加入房间:', roomId)
      joinRoom(roomId)
    }
  }, [roomId, gameState.room, gameState.isConnected, joinRoom])

  // 监听房间销毁事件
  useEffect(() => {
    if (gameState.roomDestroyed) {
      toast({
        message: '房间已被销毁，正在返回主页...',
        type: 'warning',
        duration: 3000
      })
      // 延迟跳转，让用户看到提示
      setTimeout(() => {
        navigate('/home')
      }, 1500)
    }
  }, [gameState.roomDestroyed, navigate, toast])

  if (!gameState.room || !gameState.currentPlayer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl">正在连接房间...</p>
          <Button
            onClick={() => navigate('/home')}
            variant="destructive"
            className="mt-4"
          >
            返回主页
          </Button>
        </div>
      </div>
    )
  }

  const { room, currentPlayer } = gameState
  const isRedTeam = currentPlayer.team === Team.RED
  const isOwner = room.ownerId === currentPlayer.id

  const redTeamPlayers = room.players.filter(p => p.team === Team.RED)
  const blueTeamPlayers = room.players.filter(p => p.team === Team.BLUE)

  const handleStartGame = () => {
    startGame()
  }

  const handleShowSettings = () => {
    toggleSettings()
  }

  const handleUpdateSettings = () => {
    updateRoomSettings(localSettings)
    toggleSettings()
  }

  const handleLeaveRoom = () => {
    // 显示离开提示
    toast({
      message: '正在离开房间...',
      type: 'info',
      duration: 1000
    })

    // 先离开房间
    leaveRoom()

    // 给状态更新时间，然后跳转
    setTimeout(() => {
      navigate('/home')
    }, 300)
  }

  const handleCopyRoomId = async () => {
    const success = await copyToClipboard(room.id)
    if (success) {
      setCopiedRoomId(true)
      toast({
        message: '房间ID已复制到剪贴板',
        type: 'success',
        duration: 2000
      })
      setTimeout(() => setCopiedRoomId(false), 2000)
    } else {
      toast({
        message: '复制失败，请手动复制',
        type: 'error',
        duration: 3000
      })
    }
  }

  const handleRefreshRoom = async () => {
    setIsRefreshing(true)
    try {
      refreshRoom()
      toast({
        message: '正在刷新房间状态...',
        type: 'info',
        duration: 1000
      })
      // 给socket一些时间来更新状态
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    } catch (error) {
      setIsRefreshing(false)
      toast({
        message: '刷新失败，请稍后重试',
        type: 'error',
        duration: 3000
      })
    }
  }

  // 获取当前队伍的英雄（只能看到自己队伍的）
  const currentTeamHeroes = isRedTeam ? room.redTeamHeroes : room.blueTeamHeroes
  const currentTeamName = isRedTeam ? '红队' : '蓝队'

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* 顶部栏 - 紧凑设计 */}
      <div className="m-4 space-y-3">
        {/* 第一行：房间基本信息 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            {/* 左侧：房间核心信息 */}
            <div className="flex items-center space-x-6">
              {/* 房间ID */}
              <div className="flex items-center space-x-3">
                <div className="text-muted-foreground text-sm">房间</div>
                <Button
                  onClick={handleCopyRoomId}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-semibold">{room.id.slice(0, 8)}...</span>
                    {copiedRoomId ? (
                      <span className="text-green-500 text-xs">✓</span>
                    ) : (
                      <span className="text-muted-foreground">📋</span>
                    )}
                  </div>
                </Button>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-6 bg-border"></div>

              {/* 游戏局数 */}
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground text-sm">第</span>
                <span className="font-bold text-lg">{room.gameCount}</span>
                <span className="text-muted-foreground text-sm">盘</span>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-6 bg-border"></div>

              {/* 玩家状态 */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${redTeamPlayers.length > 0 ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">红队 {redTeamPlayers.length > 0 && '✓'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${blueTeamPlayers.length > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">蓝队 {blueTeamPlayers.length > 0 && '✓'}</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  共 {room.players.length} 人
                </div>
              </div>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center space-x-2">
              {/* 刷新按钮 */}
              <Button
                onClick={handleRefreshRoom}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="ml-1">{isRefreshing ? '中' : '刷新'}</span>
              </Button>

              {isOwner && (
                <>
                  <Button
                    onClick={handleStartGame}
                    disabled={room.players.length < 2 || room.isRolling}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <span>▶️ 开始</span>
                  </Button>
                  <Button
                    onClick={handleShowSettings}
                    variant="secondary"
                    size="sm"
                  >
                    <span>⚙️</span>
                  </Button>
                </>
              )}

              <Button
                onClick={handleLeaveRoom}
                variant="destructive"
                size="sm"
              >
                <span>🚪 离开</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* 第二行：玩家身份信息（简化版） */}
        <Card className="p-3 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">当前身份：</span>
              <span className="font-medium">{currentPlayer.name}</span>
              <div className="flex items-center space-x-2">
                {isOwner && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-full text-xs font-medium">
                    👑 房主
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isRedTeam
                    ? 'bg-red-500/20 text-red-600'
                    : 'bg-blue-500/20 text-blue-600'
                }`}>
                  {isRedTeam ? '🔴 红队' : '🔵 蓝队'}
                </span>
              </div>
            </div>

            <div className="text-muted-foreground text-xs">
              ID: {currentPlayer.id.slice(0, 12)}...
            </div>
          </div>
        </Card>
      </div>

      {/* 主内容区域 */}
      <main className="container mx-auto px-6 py-10">
        {/* 等待状态 */}
        {room.players.length < 2 && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                    <span className="text-xl font-medium">等待其他玩家加入房间...</span>
                  </div>
                  <div className="flex justify-center items-center space-x-6">
                    <div className="text-center">
                      <Card className="w-20 h-20 flex items-center justify-center">
                        <span className="text-2xl font-bold">{room.players.length}</span>
                      </Card>
                      <p className="text-sm text-muted-foreground mt-2">当前玩家</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">/</div>
                    <div className="text-center">
                      <Card className="w-20 h-20 flex items-center justify-center">
                        <span className="text-2xl font-bold">2</span>
                      </Card>
                      <p className="text-sm text-muted-foreground mt-2">需要玩家</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-6">分享房间ID邀请朋友加入</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 游戏结果展示 */}
        {room.players.length >= 2 && currentTeamHeroes.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-block">
                <h2 className={`text-4xl font-bold mb-3 ${isRedTeam ? 'text-red-600' : 'text-blue-600'}`}>
                  {currentTeamName} 随机结果
                </h2>
                <div className="flex items-center justify-center space-x-6 text-muted-foreground">
                  <span className="flex items-center space-x-2">
                    <span>⏰</span>
                    <span>第 {room.gameCount} 盘</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span>📅</span>
                    <span>{new Date().toLocaleString('zh-CN')}</span>
                  </span>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                  {currentTeamHeroes.map((hero, index) => (
                    <Card key={index} className="p-4 text-center hover:shadow-md transition-shadow">
                      <div className="mx-auto mb-3" style={{ width: '50px', height: '70px' }}>
                        <HeroAvatar
                          heroName={hero}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="text-sm font-medium break-words">{hero}</div>
                    </Card>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <Card className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border-green-200">
                    <span>✅</span>
                    <span className="text-green-700 text-sm font-medium">随机完成</span>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 准备状态 */}
        {room.players.length >= 2 && currentTeamHeroes.length === 0 && !room.isRolling && (
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-10">
                  <div className="mb-8">
                    <Card className={`inline-flex items-center space-x-3 px-6 py-3 ${isOwner ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      {isOwner ? (
                        <>
                          <span className="text-green-600 text-lg font-medium">🎯</span>
                          <span className="text-green-600 text-lg font-medium">请点击"开始游戏"按钮</span>
                        </>
                      ) : (
                        <>
                          <span className="text-yellow-600 text-lg font-medium">⏰</span>
                          <span className="text-yellow-600 text-lg font-medium">等待房主开始游戏...</span>
                        </>
                      )}
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <Card className="p-6">
                      <div className="w-24 h-24 mx-auto mb-4 bg-red-50 rounded-xl flex items-center justify-center">
                        <span className="text-red-600 text-4xl font-bold">{room.settings.redCount}</span>
                      </div>
                      <h3 className="text-red-600 text-lg font-semibold mb-2">红队可选英雄</h3>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-muted-foreground text-sm">准备就绪</span>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="w-24 h-24 mx-auto mb-4 bg-blue-50 rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 text-4xl font-bold">{room.settings.blueCount}</span>
                      </div>
                      <h3 className="text-blue-600 text-lg font-semibold mb-2">蓝队可选英雄</h3>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground text-sm">准备就绪</span>
                      </div>
                    </Card>
                  </div>

                  <div className="flex items-center justify-center space-x-4 text-muted-foreground">
                    <span>ℹ️</span>
                    <span className="text-sm">游戏准备完成，所有玩家已就位</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 正在随机 */}
        {room.isRolling && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Card>
                <CardContent className="p-10">
                  <div className="mb-6">
                    <div className="inline-flex items-center space-x-4">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
                      </div>
                      <div className="text-left">
                        <h3 className="text-yellow-600 text-2xl font-bold mb-1">正在随机分配英雄...</h3>
                        <p className="text-muted-foreground">系统正在为每位玩家随机分配英雄</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <p className="text-muted-foreground text-sm">请稍候，随机过程大约需要2秒钟</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* 设置弹窗 */}
      {room.showSettings && isOwner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center space-x-3">
                  <span className="text-2xl">⚙️</span>
                  <span>房间设置</span>
                </CardTitle>
                <Button
                  onClick={toggleSettings}
                  variant="ghost"
                  size="sm"
                >
                  <span className="text-xl">❌</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* 蓝队可选英雄 */}
              <div className="space-y-4">
                <Label className="text-blue-600 font-semibold flex items-center space-x-2">
                  <span>💙</span>
                  <span>蓝队可选英雄</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">{localSettings.blueCount}</span>
                  </div>
                  <Input
                    type="range"
                    min="1"
                    max="50"
                    value={localSettings.blueCount}
                    onChange={(e) => setLocalSettings({...localSettings, blueCount: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              {/* 红队人数 */}
              <div className="space-y-4">
                <Label className="text-red-600 font-semibold flex items-center space-x-2">
                  <span>❤️</span>
                  <span>红队可选英雄</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-red-600">{localSettings.redCount}</span>
                  </div>
                  <Input
                    type="range"
                    min="1"
                    max="50"
                    value={localSettings.redCount}
                    onChange={(e) => setLocalSettings({...localSettings, redCount: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              {/* 平衡模式 */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-purple-600 text-xl">📊</span>
                    <div>
                      <Label className="text-purple-600 font-semibold">根据位置平衡随机</Label>
                      <p className="text-muted-foreground text-sm mt-1">根据英雄位置进行平衡分配</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={localSettings.balanceByRole}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, balanceByRole: checked as boolean})}
                  />
                </div>
              </Card>

              <div className="flex space-x-4 p-6 pt-0">
                <Button
                  onClick={handleUpdateSettings}
                  className="flex-1"
                >
                  <span className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>保存设置</span>
                  </span>
                </Button>
                <Button
                  onClick={toggleSettings}
                  variant="outline"
                  className="flex-1"
                >
                  <span className="flex items-center space-x-2">
                    <span>❌</span>
                    <span>取消</span>
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}