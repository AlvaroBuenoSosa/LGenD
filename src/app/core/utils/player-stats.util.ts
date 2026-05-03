import { PlayerStats } from '../../shared/models/player.model';

export class PlayerStatsUtil {

  static kd(stats: PlayerStats): number {
    return stats.kd ?? 0;
  }

  static winRate(stats: PlayerStats): number {
    return stats.winRate ?? 0;
  }

  static adr(stats: PlayerStats): number {
    return stats.adr ?? 0;
  }

  static hs(stats: PlayerStats): number {
    return stats.hs ?? 0;
  }

  static matches(stats: PlayerStats): number {
    return stats.matches ?? 0;
  }

  static wins(stats: PlayerStats): number {
    return stats.wins ?? 0;
  }
}
