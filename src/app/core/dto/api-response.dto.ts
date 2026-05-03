import { FaceitPlayerDto } from "./faceit-player.dto";
import { SteamPlayerDto } from "./steam-player.dto";

export interface ApiPlayerResponseDto {
  steam: SteamPlayerDto | null;
  faceit: FaceitPlayerDto | null;
  csstats: {
    kills: number;
    deaths: number;
    wins: number;
    matches: number;
    kd: number;
  } | null;
}
