const axios = require('axios');

const STEAM_API_KEY = process.env.STEAM_API_KEY;

const weaponNames = {
  ak47: 'AK-47',
  aug: 'AUG',
  awp: 'AWP',
  bayonet: 'Bayonet',
  bizon: 'PP-Bizon',
  cz75a: 'CZ75-Auto',
  deagle: 'Desert Eagle',
  elite: 'Dual Berettas',
  famas: 'FAMAS',
  fiveseven: 'Five-SeveN',
  g3sg1: 'G3SG1',
  galilar: 'Galil AR',
  glock: 'Glock-18',
  hegrenade: 'HE Grenade',
  knife: 'Knife',
  knife_t: 'T Knife',
  m249: 'M249',
  m4a1: 'M4A1-S',
  m4a1_silencer: 'M4A1-S',
  m4a1s: 'M4A1-S',
  m4a4: 'M4A4',
  mac10: 'MAC-10',
  mag7: 'MAG-7',
  molotov: 'Molotov',
  mp5sd: 'MP5-SD',
  mp7: 'MP7',
  mp9: 'MP9',
  negev: 'Negev',
  nova: 'Nova',
  p2000: 'P2000',
  p250: 'P250',
  p90: 'P90',
  revolver: 'R8 Revolver',
  sawedoff: 'Sawed-Off',
  scar20: 'SCAR-20',
  sg556: 'SG 553',
  sg553: 'SG 553',
  smokegrenade: 'Smoke Grenade',
  ssg08: 'SSG 08',
  taser: 'Zeus x27',
  tec9: 'Tec-9',
  ump45: 'UMP-45',
  usp_silencer: 'USP-S',
  usps: 'USP-S',
  xm1014: 'XM1014'
};

async function getSteamPlayer(steamId) {
  const res = await axios.get(
    'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
    {
      params: {
        key: STEAM_API_KEY,
        steamids: steamId
      }
    }
  );

  return res.data?.response?.players?.[0] || null;
}

async function getSteamWeaponStats(steamId) {
  if (!STEAM_API_KEY) {
    throw new Error('STEAM_API_KEY is not configured');
  }

  const res = await axios.get(
    'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/',
    {
      params: {
        key: STEAM_API_KEY,
        steamid: steamId,
        appid: 730
      }
    }
  );

  const stats = res.data?.playerstats?.stats;
  if (!Array.isArray(stats)) {
    return [];
  }

  return stats.flatMap(stat => {
    const match = typeof stat?.name === 'string'
      ? /^total_kills_(.+)$/.exec(stat.name)
      : null;
    const kills = Number(stat?.value);

    if (!match || !Number.isFinite(kills) || kills <= 0) {
      return [];
    }

    const weaponId = match[1];
    const name = weaponNames[weaponId] ??
      weaponId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());

    return [{
      name,
      imageId: weaponId,
      kills,
      hsPercent: 0,
      totalDamage: 0
    }];
  }).sort((a, b) => b.kills - a.kills);
}

module.exports = { getSteamPlayer, getSteamWeaponStats };
