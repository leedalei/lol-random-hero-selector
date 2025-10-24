import { useState } from 'react';
import { Hero } from '../types/hero';
import { ROLE_LABELS } from '../types/hero';
import { getHeroAvatar } from '../utils/avatar';

interface HeroListProps {
  heroes: Hero[];
  title?: string;
}

const HeroList: React.FC<HeroListProps> = ({ heroes, title = "英雄列表" }) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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

  return (
    <div className="card">
      <h2>{title} ({heroes.length})</h2>
      <div className="hero-grid">
        {heroes.map((hero) => (
          <div key={hero.heroId} className="hero-item">
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
              {hero.roles.map((role) => (
                <span
                  key={role}
                  className="role-tag"
                  style={{ backgroundColor: getRoleColor(role) }}
                >
                  {ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {heroes.length === 0 && (
        <div className="no-heroes">该位置暂无英雄</div>
      )}
    </div>
  );
};

export default HeroList;