import { HeroRole, ROLE_LABELS } from '../types/hero';

interface RoleFilterProps {
  selectedRole: HeroRole | 'all';
  onRoleChange: (role: HeroRole | 'all') => void;
  balanceByRole: boolean;
  onBalanceToggle: (enabled: boolean) => void;
}

const RoleFilterComponent: React.FC<RoleFilterProps> = ({
  selectedRole,
  onRoleChange,
  balanceByRole,
  onBalanceToggle
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
      <h2>英雄筛选</h2>

      <div className="filter-section">
        <h3>按位置筛选</h3>
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
      </div>

      <div className="balance-section">
        <h3>随机选项</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={balanceByRole}
            onChange={(e) => onBalanceToggle(e.target.checked)}
          />
          <span className="checkbox-text">根据位置随机（确保每个位置都有英雄）</span>
        </label>
        <p className="balance-hint">
          开启后，在随机20个英雄时会尽可能确保每个位置都有英雄代表
        </p>
      </div>
    </div>
  );
};

export default RoleFilterComponent;