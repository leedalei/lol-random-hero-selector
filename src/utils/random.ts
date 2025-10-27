import { Hero, TeamResult, HeroRole } from '../types/hero';

export function getRandomHeroes(heroes: Hero[], count: number): Hero[] {
  // 创建英雄的副本以避免修改原数组
  const heroesCopy = [...heroes];
  const selectedHeroes: Hero[] = [];

  // Fisher-Yates洗牌算法
  for (let i = heroesCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [heroesCopy[i], heroesCopy[j]] = [heroesCopy[j], heroesCopy[i]];
  }

  // 确保选中的英雄不重复
  for (let i = 0; i < count && i < heroesCopy.length; i++) {
    selectedHeroes.push(heroesCopy[i]);
  }

  return selectedHeroes;
}

export function getHeroesByRole(heroes: Hero[], role: HeroRole): Hero[] {
  return heroes.filter(hero => hero.roles.includes(role));
}

export function getBalancedHeroes(heroes: Hero[], totalCount: number): Hero[] {
  const roles: HeroRole[] = ['fighter', 'mage', 'assassin', 'tank', 'marksman', 'support'];
  const result: Hero[] = [];
  const usedHeroIds = new Set<string>();

  // 每个位置至少分配一个英雄
  const minPerRole = Math.floor(totalCount / roles.length);
  const remainder = totalCount % roles.length;

  // 为每个位置随机选择英雄
  for (const role of roles) {
    const heroesInRole = heroes.filter(hero =>
      hero.roles.includes(role) && !usedHeroIds.has(hero.heroId)
    );
    const countForRole = minPerRole + (roles.indexOf(role) < remainder ? 1 : 0);

    if (heroesInRole.length > 0) {
      const selectedForRole = getRandomHeroes(heroesInRole, Math.min(countForRole, heroesInRole.length));

      // 标记已使用的英雄ID
      selectedForRole.forEach(hero => usedHeroIds.add(hero.heroId));
      result.push(...selectedForRole);
    }
  }

  // 如果还需要更多英雄，从剩余的英雄中随机选择
  if (result.length < totalCount) {
    const remainingHeroes = heroes.filter(hero => !usedHeroIds.has(hero.heroId));
    const additionalNeeded = totalCount - result.length;

    if (remainingHeroes.length > 0) {
      const additionalHeroes = getRandomHeroes(remainingHeroes, additionalNeeded);
      additionalHeroes.forEach(hero => usedHeroIds.add(hero.heroId));
      result.push(...additionalHeroes);
    }
  }

  // 确保返回正确数量的英雄
  if (result.length > totalCount) {
    // 如果选择的英雄超过了总数，从结果中随机选择
    const finalResult = getRandomHeroes(result, totalCount);
    return finalResult;
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

  // 验证可用英雄数量
  if (heroes.length < totalNeeded) {
    throw new Error(`可用英雄数量(${heroes.length})不足以分配${totalNeeded}个英雄`);
  }

  let selectedHeroes: Hero[];

  if (balanceByRole && totalNeeded >= 6) {
    // 当开启平衡模式且需要较多英雄时，使用平衡选择
    selectedHeroes = getBalancedHeroes(heroes, totalNeeded);
  } else {
    // 普通随机选择
    selectedHeroes = getRandomHeroes(heroes, totalNeeded);
  }

  // 验证选择结果
  if (selectedHeroes.length !== totalNeeded) {
    console.warn(`警告: 选择了${selectedHeroes.length}个英雄，但需要${totalNeeded}个英雄`);
    // 如果数量不对，尝试重新选择
    if (selectedHeroes.length < totalNeeded) {
      console.warn('尝试补充选择英雄...');
      const remainingHeroes = heroes.filter(hero =>
        !selectedHeroes.some(selected => selected.heroId === hero.heroId)
      );
      const additionalNeeded = totalNeeded - selectedHeroes.length;

      if (remainingHeroes.length >= additionalNeeded) {
        const additionalHeroes = getRandomHeroes(remainingHeroes, additionalNeeded);
        selectedHeroes.push(...additionalHeroes);
      }
    }
  }

  // 确保英雄唯一性 - 双重检查
  const uniqueHeroes = [];
  const seenHeroIds = new Set<string>();

  for (const hero of selectedHeroes) {
    if (!seenHeroIds.has(hero.heroId)) {
      seenHeroIds.add(hero.heroId);
      uniqueHeroes.push(hero);
    }
  }

  // 如果仍有问题，使用备用方法
  if (uniqueHeroes.length < totalNeeded) {
    console.warn(`检测到重复英雄，使用备用随机算法...`);
    const freshHeroes = heroes.filter(hero => !seenHeroIds.has(hero.heroId));
    if (freshHeroes.length >= totalNeeded) {
      return generateTeamResult(freshHeroes, blueCount, redCount, balanceByRole);
    }
  }

  // 将选中的英雄分配到蓝队和红队
  const shuffled = uniqueHeroes.sort(() => 0.5 - Math.random());
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