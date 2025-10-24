
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface TeamSettingsProps {
  blueCount: number;
  redCount: number;
  onBlueCountChange: (count: number) => void;
  onRedCountChange: (count: number) => void;
  onRandomize: () => void;
}

const TeamSettings: React.FC<TeamSettingsProps> = ({
  blueCount,
  redCount,
  onBlueCountChange,
  onRedCountChange,
  onRandomize
}) => {
  const handleBlueCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 50) {
      onBlueCountChange(value);
    }
  };

  const handleRedCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 50) {
      onRedCountChange(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="blue-count" className="text-blue-600 font-semibold flex items-center space-x-2">
            <span>💙</span>
            <span>蓝队可选英雄</span>
          </Label>
          <Input
            id="blue-count"
            type="number"
            min="0"
            max="50"
            value={blueCount}
            onChange={handleBlueCountChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="red-count" className="text-red-600 font-semibold flex items-center space-x-2">
            <span>❤️</span>
            <span>红队可选英雄</span>
          </Label>
          <Input
            id="red-count"
            type="number"
            min="0"
            max="50"
            value={redCount}
            onChange={handleRedCountChange}
          />
        </div>
      </div>
      <Button
        onClick={onRandomize}
        className="w-full"
        size="lg"
      >
        <span className="flex items-center space-x-2">
          <span>🎲</span>
          <span>开始随机</span>
        </span>
      </Button>
    </div>
  );
};

export default TeamSettings;