import { Hero, TeamResult, HeroRole } from '../types/hero';

export function getRandomHeroes(heroes: Hero[], count: number): Hero[] {
  const shuffled = [...heroes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getHeroesByRole(heroes: Hero[], role: HeroRole): Hero[] {
  return heroes.filter(hero => hero.roles.includes(role));
}

export function getBalancedHeroes(heroes: Hero[], totalCount: number): Hero[] {
  const roles: HeroRole[] = ['fighter', 'mage', 'assassin', 'tank', 'marksman', 'support'];
  const result: Hero[] = [];

  // 每个位置至少分配一个英雄
  const minPerRole = Math.floor(totalCount / roles.length);
  const remainder = totalCount % roles.length;

  // 为每个位置随机选择英雄
  for (const role of roles) {
    const heroesInRole = getHeroesByRole(heroes, role);
    const countForRole = minPerRole + (roles.indexOf(role) < remainder ? 1 : 0);

    if (heroesInRole.length > 0) {
      const selectedForRole = getRandomHeroes(heroesInRole, Math.min(countForRole, heroesInRole.length));
      result.push(...selectedForRole);
    }
  }

  // 如果还需要更多英雄，从剩余的英雄中随机选择
  if (result.length < totalCount) {
    const remainingHeroes = heroes.filter(hero => !result.includes(hero));
    const additionalNeeded = totalCount - result.length;
    const additionalHeroes = getRandomHeroes(remainingHeroes, additionalNeeded);
    result.push(...additionalHeroes);
  }

  // 如果选择的英雄超过了总数，随机移除一些
  if (result.length > totalCount) {
    return getRandomHeroes(result, totalCount);
  }

  return result;
}

export function generateTeamResult(
  heroes: Hero[],
  blueCount: number,
  redCount: number,
  balanceByRole: boolean = false
): TeamResult {
  const totalNeeded = blueCount + redCount;
  let selectedHeroes: Hero[];

  if (balanceByRole && totalNeeded >= 6) {
    // 当开启平衡模式且需要较多英雄时，使用平衡选择
    selectedHeroes = getBalancedHeroes(heroes, totalNeeded);
  } else {
    // 普通随机选择
    selectedHeroes = getRandomHeroes(heroes, totalNeeded);
  }

  // 将选中的英雄分配到蓝队和红队
  const shuffled = selectedHeroes.sort(() => 0.5 - Math.random());
  const blueTeam = shuffled.slice(0, blueCount);
  const redTeam = shuffled.slice(blueCount);

  return {
    blueTeam,
    redTeam,
    timestamp: new Date()
  };
}

export function filterHeroesByRole(heroes: Hero[], role: HeroRole | 'all'): Hero[] {
  if (role === 'all') {
    return heroes;
  }
  return getHeroesByRole(heroes, role);
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}