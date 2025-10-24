import { useState } from 'react';
import { TeamResult } from '../types/hero';
import { formatTimestamp } from '../utils/random';
import { ROLE_LABELS } from '../types/hero';
import { getHeroAvatar } from '../utils/avatar';
import { captureElementToClipboard } from '../utils/screenshot';

interface RandomResultProps {
  result: TeamResult | null;
}

const RandomResult: React.FC<RandomResultProps> = ({ result }) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  if (!result) {
    return null;
  }

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      fighter: '#ff6b6b',
      mage: '#4ecdc4',
      assassin: '#95e77e',
      tank: '#ffe66d',
      marksman: '#a8e6cf',
      support: '#ffd3b6'
    };
    return colors[role] || '#888';
  };

  const handleImageError = (heroId: string) => {
    setImageErrors(prev => new Set(prev).add(heroId));
  };

  const renderHero = (hero: any) => (
    <div key={hero.heroId} className="hero-item team-hero-item">
      <div className="hero-avatar">
        {!imageErrors.has(hero.heroId) ? (
          <img
            src={getHeroAvatar(hero)}
            alt={hero.name}
            className="hero-avatar-img"
            onError={() => handleImageError(hero.heroId)}
          />
        ) : (
          <div className="hero-avatar-fallback">
            {hero.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="hero-name">{hero.name}</div>
      <div className="hero-alias">({hero.alias})</div>
      <div className="hero-roles">
        {hero.roles.map((role: string) => (
          <span
            key={role}
            className="role-tag small"
            style={{ backgroundColor: getRoleColor(role) }}
          >
            {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card">
      <h2>随机结果</h2>
      <div className="layout-container">
        <div className="team-section">
          <div className="team-header">
            <h3>蓝队 ({result.blueTeam.length})</h3>
            <div className="team-controls">
              <div className="team-timestamp">
                {formatTimestamp(result.timestamp)}
              </div>
              <button
                className="screenshot-btn"
                onClick={() => captureElementToClipboard('blue-team-result', '蓝队')}
              >
                📸 截图
              </button>
            </div>
          </div>
          <div id="blue-team-result" className="team-result hero-grid">
            {result.blueTeam.map((hero) => renderHero(hero))}
          </div>
        </div>

        <div className="team-section">
          <div className="team-header">
            <h3>红队 ({result.redTeam.length})</h3>
            <div className="team-controls">
              <div className="team-timestamp">
                {formatTimestamp(result.timestamp)}
              </div>
              <button
                className="screenshot-btn"
                onClick={() => captureElementToClipboard('red-team-result', '红队')}
              >
                📸 截图
              </button>
            </div>
          </div>
          <div id="red-team-result" className="team-result hero-grid">
            {result.redTeam.map((hero) => renderHero(hero))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RandomResult;