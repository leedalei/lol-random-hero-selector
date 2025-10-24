import { useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import { Team, RoomSettings } from '../types/room'

export default function GameRoom() {
  const { gameState, leaveRoom, startGame, updateRoomSettings, toggleSettings } = useSocket()
  const [localSettings, setLocalSettings] = useState<RoomSettings>(
    gameState.room?.settings || {
      blueCount: 20,
      redCount: 20,
      balanceByRole: false
    }
  )

  if (!gameState.room || !gameState.currentPlayer) {
    return null
  }

  const { room, currentPlayer } = gameState
  const isRedTeam = currentPlayer.team === Team.RED
  const isOwner = room.ownerId === currentPlayer.id
  const bgColor = isRedTeam ? 'from-red-900/20' : 'from-blue-900/20'

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

  // 获取当前队伍的英雄（只能看到自己队伍的）
  const currentTeamHeroes = isRedTeam ? room.redTeamHeroes : room.blueTeamHeroes
  const currentTeamName = isRedTeam ? '红队' : '蓝队'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} via-purple-900/20 to-gray-900/20`}>
      {/* 顶部栏 */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧信息 */}
            <div className="flex items-center space-x-6">
              {/* 房间ID */}
              <div className="text-white">
                <span className="text-xs opacity-70">房间ID</span>
                <div className="font-mono text-sm">{room.id}...</div>
              </div>

              {/* 游戏局数 */}
              <div className="text-white">
                <span className="text-xs opacity-70">第几盘</span>
                <div className="text-lg font-bold">第 {room.gameCount} 盘</div>
              </div>

              {/* 房间状态 */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className={`w-3 h-3 rounded-full ${redTeamPlayers.length > 0 ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                  <span className="text-white text-xs">红队 {redTeamPlayers.length > 0 ? '✓' : ''}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-3 h-3 rounded-full ${blueTeamPlayers.length > 0 ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                  <span className="text-white text-xs">蓝队 {blueTeamPlayers.length > 0 ? '✓' : ''}</span>
                </div>
              </div>

              {/* 玩家名称 */}
              <div className="text-white">
                <span className="text-xs opacity-70">当前玩家</span>
                <div className="text-sm font-semibold">{currentPlayer.name}</div>
              </div>
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center space-x-3">
              {isOwner && (
                <>
                  <button
                    onClick={handleStartGame}
                    disabled={room.players.length < 2 || room.isRolling}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    开始
                  </button>
                  <button
                    onClick={handleShowSettings}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    设置
                  </button>
                </>
              )}
              <button
                onClick={leaveRoom}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                离开
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="container mx-auto px-4 py-8">
        {/* 等待状态 */}
        {room.players.length < 2 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center space-x-2 text-white/80 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
              <span className="text-xl">等待其他玩家加入房间...</span>
            </div>
            <p className="text-white/60">当前房间: {room.players.length}/2 人</p>
          </div>
        )}

        {/* 游戏结果展示 */}
        {room.players.length >= 2 && currentTeamHeroes.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${isRedTeam ? 'text-red-400' : 'text-blue-400'}`}>
                {currentTeamName} 随机结果
              </h2>
              <p className="text-white/70">第 {room.gameCount} 盘游戏</p>
              <p className="text-white/50 text-sm">
                {new Date().toLocaleString('zh-CN')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {currentTeamHeroes.map((hero, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition-colors">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {hero[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-white text-xs truncate">{hero}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 准备状态 */}
        {room.players.length >= 2 && currentTeamHeroes.length === 0 && !room.isRolling && (
          <div className="text-center py-16">
            <div className="text-white/80 text-lg mb-4">
              {isOwner ? '请点击"开始"按钮开始游戏' : '等待房主开始游戏...'}
            </div>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                  <span className="text-red-400 text-2xl font-bold">
                    {room.settings.redCount}
                  </span>
                </div>
                <p className="text-white/70">红队可选英雄</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                  <span className="text-blue-400 text-2xl font-bold">
                    {room.settings.blueCount}
                  </span>
                </div>
                <p className="text-white/70">蓝队可选英雄</p>
              </div>
            </div>
          </div>
        )}

        {/* 正在随机 */}
        {room.isRolling && (
          <div className="text-center py-16">
            <div className="inline-flex items-center space-x-3 text-yellow-300">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-300"></div>
              <span className="text-xl">正在随机分配英雄...</span>
            </div>
          </div>
        )}
      </main>

      {/* 设置弹窗 */}
      {room.showSettings && isOwner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">房间设置</h2>

            <div className="space-y-6">
              {/* 蓝队可选英雄 */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  蓝队可选英雄: {localSettings.blueCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={localSettings.blueCount}
                  onChange={(e) => setLocalSettings({...localSettings, blueCount: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              {/* 红队人数 */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  红队可选英雄: {localSettings.redCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={localSettings.redCount}
                  onChange={(e) => setLocalSettings({...localSettings, redCount: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              {/* 平衡模式 */}
              <div className="flex items-center justify-between">
                <label className="text-gray-700 text-sm font-medium">
                  根据位置平衡随机
                </label>
                <button
                  onClick={() => setLocalSettings({...localSettings, balanceByRole: !localSettings.balanceByRole})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localSettings.balanceByRole ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    localSettings.balanceByRole ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={handleUpdateSettings}
                className="flex-1 bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
              >
                保存设置
              </button>
              <button
                onClick={toggleSettings}
                className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}