import { HeroRole } from '../types/hero';
import { ROLE_LABELS } from '../types/hero';
import TeamSettings from './TeamSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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

  const getRoleEmoji = (role: HeroRole | 'all'): string => {
    const roleEmojis: Record<HeroRole | 'all', string> = {
      all: '🎯',
      fighter: '⚔️',
      mage: '🔮',
      assassin: '🗡️',
      tank: '🛡️',
      marksman: '🏹',
      support: '💚'
    };
    return roleEmojis[role];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center space-x-3">
          <span>⚙️</span>
          <span>游戏控制面板</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 英雄筛选区域 */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <span>🎭</span>
              <span>英雄筛选</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {roleOptions.map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  onClick={() => onRoleChange(role)}
                  className="flex items-center space-x-2"
                >
                  <span>{getRoleEmoji(role)}</span>
                  <span className="text-sm">{getRoleLabel(role)}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 随机选项 */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <span>🎲</span>
              <span>随机选项</span>
            </h3>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="balance"
                checked={balanceByRole}
                onCheckedChange={onBalanceToggle}
              />
              <Label htmlFor="balance" className="cursor-pointer">
                根据位置平衡随机
              </Label>
            </div>
            <p className="text-muted-foreground text-sm mt-2 ml-6">
              开启后，系统会确保每个位置都有合理的英雄代表
            </p>
          </CardContent>
        </Card>

        {/* 队伍设置 */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <span>⚔️</span>
              <span>队伍设置</span>
            </h3>
            <TeamSettings
              blueCount={blueCount}
              redCount={redCount}
              onBlueCountChange={onBlueCountChange}
              onRedCountChange={onRedCountChange}
              onRandomize={onRandomize}
            />
          </CardContent>
        </Card>

        {/* 重新随机按钮 */}
        {showRerandomize && (
          <Button
            onClick={onRerandomize}
            className="w-full"
            variant="secondary"
          >
            <span className="flex items-center space-x-2">
              <span>🔄</span>
              <span>重新随机</span>
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterAndControls;