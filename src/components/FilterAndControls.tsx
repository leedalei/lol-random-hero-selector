import { HeroRole } from '../types/hero';
import { ROLE_LABELS } from '../types/hero';
import TeamSettings from './TeamSettings';

interface FilterAndControlsProps {
  selectedRole: HeroRole | 'all';
  onRoleChange: (role: HeroRole | 'all') => void;
  balanceByRole: boolean;
  onBalanceToggle: (enabled: boolean) => void;
  blueCount: number;
  redCount: number;
  onBlueCountChange: (count: number) => void;
  onRedCountChange: (count: number) => void;
  onRandomize: () => void;
  onRerandomize: () => void;
  showRerandomize: boolean;
}

const FilterAndControls: React.FC<FilterAndControlsProps> = ({
  selectedRole,
  onRoleChange,
  balanceByRole,
  onBalanceToggle,
  blueCount,
  redCount,
  onBlueCountChange,
  onRedCountChange,
  onRandomize,
  onRerandomize,
  showRerandomize
}) => {
  const roleOptions: (HeroRole | 'all')[] = [
    'all',
    'fighter',
    'mage',
    'assassin',
    'tank',
    'marksman',
    'support'
  ];

  const getRoleLabel = (role: HeroRole | 'all'): string => {
    if (role === 'all') return '全部';
    return ROLE_LABELS[role];
  };

  return (
    <div className="card">
      <div className="filter-controls-layout">
        <div className="filter-section">
          <h3>英雄筛选</h3>
          <div className="role-options">
            {roleOptions.map((role) => (
              <label key={role} className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => onRoleChange(role)}
                />
                <span className="radio-text">{getRoleLabel(role)}</span>
              </label>
            ))}
          </div>

          <div className="balance-section">
            <h3>随机选项</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={balanceByRole}
                onChange={(e) => onBalanceToggle(e.target.checked)}
              />
              <span className="checkbox-text">根据位置随机</span>
            </label>
            <p className="balance-hint">
              开启后，在随机20个英雄时会尽可能确保每个位置都有英雄代表
            </p>
          </div>
        </div>

        <div className="controls-section">
          <h3>队伍设置</h3>
          <TeamSettings
            blueCount={blueCount}
            redCount={redCount}
            onBlueCountChange={onBlueCountChange}
            onRedCountChange={onRedCountChange}
            onRandomize={onRandomize}
          />

          {showRerandomize && (
            <button onClick={onRerandomize} className="rerandom-btn">
              重新随机
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterAndControls;