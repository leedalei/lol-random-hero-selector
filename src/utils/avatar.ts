import { Hero } from '../types/hero';

export function getHeroAvatar(hero: Hero): string {
  if (hero.avatar) {
    return hero.avatar;
  }

  // 使用instance_id生成头像URL
  const baseUrl = 'https://game.gtimg.cn/images/lol/act/img/skinloading/';
  return `${baseUrl}${hero.instance_id}.jpg`;
}

export function getHeroAvatarWithFallback(hero: Hero): string {
  const avatarUrl = getHeroAvatar(hero);

  // 如果头像加载失败，返回默认头像
  return avatarUrl;
}