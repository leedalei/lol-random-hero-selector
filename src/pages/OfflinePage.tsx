import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroList from '../components/HeroList'
import RandomResult from '../components/RandomResult'
import FilterAndControls from '../components/FilterAndControls'
import { heroes } from '../data/heroes'
import { generateTeamResult, filterHeroesByRole } from '../utils/random'
import { TeamResult, HeroRole } from '../types/hero'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from 'sonner'
import { useToast } from '@/hooks/use-toast'

export default function OfflinePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [blueCount, setBlueCount] = useState<number>(20)
  const [redCount, setRedCount] = useState<number>(20)
  const [selectedRole, setSelectedRole] = useState<HeroRole | 'all'>('all')
  const [balanceByRole, setBalanceByRole] = useState<boolean>(false)
  const [currentResult, setCurrentResult] = useState<TeamResult | null>(null)

  // 根据筛选条件获取英雄列表
  const filteredHeroes = filterHeroesByRole(heroes, selectedRole)

  const handleRandomize = () => {
    const availableHeroes = filteredHeroes.length > 0 ? filteredHeroes : heroes

    if (blueCount + redCount > availableHeroes.length) {
      toast({
        message: `总人数 (${blueCount + redCount}) 不能超过可用英雄总数 (${availableHeroes.length})`,
        type: 'error',
        duration: 4000
      })
      return
    }

    const result = generateTeamResult(availableHeroes, blueCount, redCount, balanceByRole)
    setCurrentResult(result)

    toast({
      message: '英雄随机分配完成！',
      type: 'success',
      duration: 3000
    })
  }

  const handleRerandomize = () => {
    handleRandomize()
  }

  const getRoleFilterTitle = () => {
    if (selectedRole === 'all') {
      return '所有英雄'
    }
    const roleLabels: Record<HeroRole, string> = {
      fighter: '战士',
      mage: '法师',
      assassin: '刺客',
      tank: '坦克',
      marksman: '射手',
      support: '辅助'
    }
    return `${roleLabels[selectedRole]}英雄`
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      {/* 顶部导航栏 */}
      <Card className="m-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">🎯</span>
              </div>
              <span>LOL 随机英雄选择器</span>
              <span className="text-primary text-lg font-medium">- 单机模式</span>
            </h1>
            <Button
              onClick={() => navigate('/home')}
            >
              🚀 返回在线模式
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="container mx-auto px-4 py-8">
        <div className="controls-section mb-8">
          <FilterAndControls
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            balanceByRole={balanceByRole}
            onBalanceToggle={setBalanceByRole}
            blueCount={blueCount}
            redCount={redCount}
            onBlueCountChange={setBlueCount}
            onRedCountChange={setRedCount}
            onRandomize={handleRandomize}
            onRerandomize={handleRerandomize}
            showRerandomize={currentResult !== null}
          />
        </div>

        {/* 筛选结果放在所有英雄上面 */}
        {currentResult && (
          <Card className="mb-8 bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white text-center">
                🎲 随机结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RandomResult result={currentResult} />
            </CardContent>
          </Card>
        )}

        <HeroList
          heroes={filteredHeroes}
          title={getRoleFilterTitle()}
        />
      </div>
    </div>
  )
}