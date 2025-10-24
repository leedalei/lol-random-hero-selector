export type HeroRole = 'fighter' | 'mage' | 'assassin' | 'tank' | 'marksman' | 'support';

export interface Hero {
  heroId: string;
  name: string;
  alias: string;
  title: string;
  roles: HeroRole[];
  attack: string;
  defense: string;
  magic: string;
  difficulty: string;
  selectAudio: string;
  banAudio: string;
  goldPrice: string;
  couponPrice: string;
  keywords: string;
  instance_id: string;
  isWeekFree: string;
  isARAMweekfree: string;
  ispermanentweekfree: string;
  avatar?: string; // 头像URL
  [key: string]: any
}

export interface TeamResult {
  blueTeam: Hero[];
  redTeam: Hero[];
  timestamp: Date;
}

export interface RoleFilter {
  role: HeroRole | 'all';
  label: string;
}

export const ROLE_LABELS: Record<HeroRole, string> = {
  fighter: '战士',
  mage: '法师',
  assassin: '刺客',
  tank: '坦克',
  marksman: '射手',
  support: '辅助'
};