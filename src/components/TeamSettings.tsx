
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
    <div className="team-settings">
      <div className="control-group">
        <label htmlFor="blue-count">蓝队:</label>
        <input
          id="blue-count"
          type="number"
          min="0"
          max="50"
          value={blueCount}
          onChange={handleBlueCountChange}
        />
      </div>
      <div className="control-group">
        <label htmlFor="red-count">红队:</label>
        <input
          id="red-count"
          type="number"
          min="0"
          max="50"
          value={redCount}
          onChange={handleRedCountChange}
        />
      </div>
      <button onClick={onRandomize} className="random-btn">
        开始随机
      </button>
    </div>
  );
};

export default TeamSettings;