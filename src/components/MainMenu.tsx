import { useSocket } from '../hooks/useSocket'

interface MainMenuProps {
  onOfflineMode: () => void
}

export default function MainMenu({ onOfflineMode }: MainMenuProps) {
  const { gameState, createRoom, showJoinDialog, hideJoinDialog, joinRoom, setJoinRoomId } = useSocket()

  const handleJoinRoom = () => {
    joinRoom(gameState.joinRoomId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col">
      {/* 顶部标题区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">LOL 随机英雄</h1>
          <p className="text-xl text-gray-300 mb-8">在线联机对战版</p>

          {/* 玩家信息 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {gameState.playerName[0]?.toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-white/80 text-sm">当前玩家</p>
                <p className="text-white font-semibold text-lg">{gameState.playerName}</p>
              </div>
            </div>
          </div>

          {/* 连接状态 */}
          <div className="flex items-center justify-center mb-8">
            <div className={`w-3 h-3 rounded-full mr-2 ${gameState.isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            <span className="text-white/80">
              {gameState.isConnected ? '已连接到服务器' : '正在连接服务器...'}
            </span>
          </div>
        </div>
      </div>

      {/* 底部按钮区域 */}
      <div className="p-8">
        <div className="max-w-md mx-auto gap-3">
          <button
            onClick={createRoom}
            disabled={!gameState.isConnected}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 text-lg"
          >
            创建房间
          </button>

          <button
            onClick={showJoinDialog}
            disabled={!gameState.isConnected}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 text-lg"
          >
            加入房间
          </button>

          <button
            onClick={onOfflineMode}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-4 px-8 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
          >
            单机模式
          </button>
        </div>

        {/* 游戏说明 */}
        <div className="max-w-md mx-auto mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-white font-semibold mb-2">游戏说明</h3>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• 每个房间最多2名玩家，自动分配红蓝两队</li>
            <li>• 只有房主可以开始游戏，设置队伍参数</li>
            <li>• 点击开始后每位玩家只能看到自己队伍的英雄</li>
            <li>• 房间空闲30秒自动销毁</li>
          </ul>
        </div>
      </div>

      {/* 加入房间对话框 */}
      {gameState.showJoinDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">加入房间</h2>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">房间ID</label>
              <input
                type="text"
                value={gameState.joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="请输入32位房间ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                maxLength={32}
              />
              <p className="text-xs text-gray-500 mt-2">房间ID为32位字符</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleJoinRoom}
                disabled={!gameState.joinRoomId.trim()}
                className="flex-1 bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                加入房间
              </button>
              <button
                onClick={hideJoinDialog}
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