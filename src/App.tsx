import { useState } from 'react';
import HeroList from './components/HeroList';
import RandomResult from './components/RandomResult';
import FilterAndControls from './components/FilterAndControls';
import { heroes } from './data/heroes';
import { generateTeamResult, filterHeroesByRole } from './utils/random';
import { TeamResult, HeroRole } from './types/hero';

function App() {
  const [blueCount, setBlueCount] = useState<number>(20);
  const [redCount, setRedCount] = useState<number>(20);
  const [selectedRole, setSelectedRole] = useState<HeroRole | 'all'>('all');
  const [balanceByRole, setBalanceByRole] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<TeamResult | null>(null);

  // 根据筛选条件获取英雄列表
  const filteredHeroes = filterHeroesByRole(heroes, selectedRole);

  const handleRandomize = () => {
    const availableHeroes = filteredHeroes.length > 0 ? filteredHeroes : heroes;

    if (blueCount + redCount > availableHeroes.length) {
      alert(`总人数 (${blueCount + redCount}) 不能超过可用英雄总数 (${availableHeroes.length})`);
      return;
    }

    const result = generateTeamResult(availableHeroes, blueCount, redCount, balanceByRole);
    setCurrentResult(result);
  };

  const handleRerandomize = () => {
    handleRandomize();
  };

  const getRoleFilterTitle = () => {
    if (selectedRole === 'all') {
      return '所有英雄';
    }
    const roleLabels: Record<HeroRole, string> = {
      fighter: '战士',
      mage: '法师',
      assassin: '刺客',
      tank: '坦克',
      marksman: '射手',
      support: '辅助'
    };
    return `${roleLabels[selectedRole]}英雄`;
  };

  return (
    <div className="App">
      <h1>LOL 随机英雄选择器</h1>

      <div className="controls-section">
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
        <RandomResult
          result={currentResult}
        />
      )}

      <HeroList
        heroes={filteredHeroes}
        title={getRoleFilterTitle()}
      />
    </div>
  );
}

export default App;