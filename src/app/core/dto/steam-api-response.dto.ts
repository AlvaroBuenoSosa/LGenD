import { SteamPlayerDto } from "./steam-player.dto";

export interface SteamApiResponse {
  data: {
    player: SteamPlayerDto;
  };
  cached: boolean;
}
