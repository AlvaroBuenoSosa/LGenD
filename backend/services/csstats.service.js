const axios = require('axios');

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

const headers = {
  Authorization: `Bearer ${FACEIT_API_KEY}`
};

// ======================
// HELPERS
// ======================

function n(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function isWinningTeam(team) {

  const stats = team?.team_stats || {};

  return (
    stats["Team Win"] === "1" ||
    stats["Winner"] === "1" ||
    stats["Win"] === "1" ||
    stats["Result"] === "1" ||
    stats["Final Result"] === "1"
  );
}

function normalizeMapName(map) {

  if (!map) {
    return 'Unknown';
  }

  return map
    .replace('de_', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

const weaponAliases = new Map([
  ['ak47', 'AK-47'],
  ['aug', 'AUG'],
  ['awp', 'AWP'],
  ['bizon', 'PP-Bizon'],
  ['cz75auto', 'CZ75-Auto'],
  ['deagle', 'Desert Eagle'],
  ['dualberettas', 'Dual Berettas'],
  ['elite', 'Dual Berettas'],
  ['famas', 'FAMAS'],
  ['fiveseven', 'Five-SeveN'],
  ['g3sg1', 'G3SG1'],
  ['galil', 'Galil AR'],
  ['galilar', 'Galil AR'],
  ['glock', 'Glock-18'],
  ['glock18', 'Glock-18'],
  ['m249', 'M249'],
  ['m4a1', 'M4A1-S'],
  ['m4a1s', 'M4A1-S'],
  ['m4a4', 'M4A4'],
  ['mac10', 'MAC-10'],
  ['mag7', 'MAG-7'],
  ['mp5sd', 'MP5-SD'],
  ['mp7', 'MP7'],
  ['mp9', 'MP9'],
  ['negev', 'Negev'],
  ['nova', 'Nova'],
  ['p2000', 'P2000'],
  ['p250', 'P250'],
  ['p90', 'P90'],
  ['revolver', 'R8 Revolver'],
  ['sawedoff', 'Sawed-Off'],
  ['scar20', 'SCAR-20'],
  ['sg553', 'SG 553'],
  ['ssg08', 'SSG 08'],
  ['taser', 'Zeus x27'],
  ['tec9', 'Tec-9'],
  ['ump45', 'UMP-45'],
  ['usp', 'USP-S'],
  ['usps', 'USP-S'],
  ['xm1014', 'XM1014'],
  ['zeus', 'Zeus x27']
]);

function parseWeaponKills(value) {
  let weaponKills = value;

  if (typeof weaponKills === 'string') {
    try {
      weaponKills = JSON.parse(weaponKills);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.warn('Invalid FACEIT weapon kills JSON');
        return [];
      }

      throw error;
    }
  }

  if (Array.isArray(weaponKills)) {
    return weaponKills
      .filter(weapon => weapon && typeof weapon === 'object' && typeof weapon.name === 'string')
      .map(weapon => [weapon.name, n(weapon.kills)])
      .filter(([, kills]) => kills > 0);
  }

  if (weaponKills && typeof weaponKills === 'object') {
    return Object.entries(weaponKills)
      .map(([name, stats]) => [
        name,
        n(stats && typeof stats === 'object' ? stats.kills : stats)
      ])
      .filter(([, kills]) => kills > 0);
  }

  return [];
}

function getWeaponKills(playerStats) {
  const entries = Object.entries(playerStats || {});
  const weaponKillsEntry = entries.find(([name]) =>
    name.toLowerCase().replace(/[\s_-]/g, '') === 'weaponkills'
  );

  if (weaponKillsEntry) {
    return parseWeaponKills(weaponKillsEntry[1]);
  }

  return entries.flatMap(([statName, value]) => {
    const normalizedStatName = statName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const weapon = [...weaponAliases.entries()]
      .find(([alias]) =>
        normalizedStatName === alias ||
        (normalizedStatName.includes('kill') && normalizedStatName.includes(alias))
      );

    const kills = n(value);
    return weapon && kills > 0 ? [[weapon[1], kills]] : [];
  });
}

// ======================
// MAIN FUNCTION
// ======================

async function getCsStats(steamId) {

  // ======================
  // GET PLAYER
  // ======================

  const playerRes = await axios.get(
    'https://open.faceit.com/data/v4/players',
    {
      headers,
      params: {
        game: 'cs2',
        game_player_id: steamId
      }
    }
  );

  const player = playerRes.data;

  if (!player?.player_id) {
    return null;
  }

  console.log('\n==============================');
  console.log('🔍 FACEIT STATS START');
  console.log('==============================');

  console.log('👤 Player:', player.nickname);
  console.log('🆔 FACEIT ID:', player.player_id);

  // ======================
  // MATCH HISTORY
  // ======================

  const historyRes = await axios.get(
    `https://open.faceit.com/data/v4/players/${player.player_id}/history`,
    {
      headers,
      params: {
        game: 'cs2',
        limit: 100
      }
    }
  );

  const matches = historyRes.data?.items || [];

  console.log('📦 Matches:', matches.length);

  // ======================
  // TOTALS
  // ======================

  let kills = 0;
  let deaths = 0;
  let wins = 0;

  let adr = 0;
  let hsPercent = 0;
  let clutchSuccess = 0;
  let entrySuccess = 0;

  let processedMatches = 0;

  const form = [];

  const weaponStats = {};
  let lastPlayerStatsKeys = [];
  const mapStats = {};

  const matchDetails = [];

  // ======================
  // LOOP MATCHES
  // ======================

  for (const match of matches) {

    try {

      const statsRes = await axios.get(
        `https://open.faceit.com/data/v4/matches/${match.match_id}/stats`,
        { headers }
      );

      const round = statsRes.data?.rounds?.[0];

      if (!round?.teams) {
        console.log('⚠️ Invalid match data');
        continue;
      }

      // ======================
      // MAP
      // ======================

      const rawMap =
        round?.round_stats?.Map ||
        match?.results?.Map ||
        'Unknown';

      const mapName = normalizeMapName(rawMap);

      console.log(`\n🎮 MATCH: ${match.match_id}`);
      console.log(`🗺️ Map: ${mapName}`);

      let found = false;
      let matchWin = false;
      let playerData = null;

      // ======================
      // TEAMS
      // ======================

      for (const team of round.teams) {

        const win = isWinningTeam(team);

        for (const p of team.players || []) {

          if (p.player_id !== player.player_id) {
            continue;
          }

          // DEBUG
          console.log('📄 RAW PLAYER STATS:', p.player_stats);
          lastPlayerStatsKeys = Object.keys(p.player_stats || {});

          // ======================
          // PLAYER STATS
          // ======================

          const k = n(p.player_stats?.Kills);

          const d = n(p.player_stats?.Deaths);

          const a = n(p.player_stats?.ADR);

          const hs =
            n(p.player_stats?.['Headshots %']) ||
            n(p.player_stats?.['Headshot %']) ||
            n(p.player_stats?.['HS %']) ||
            0;

          const clutch =
            n(p.player_stats?.['Clutch Success %']);

          const entry =
            n(p.player_stats?.['Entry Success %']);

          // ======================
          // TOTALS
          // ======================

          kills += k;
          deaths += d;

          adr += a;
          hsPercent += hs;

          clutchSuccess += clutch;
          entrySuccess += entry;

          if (win) {
            wins++;
          }

          found = true;
          matchWin = win;
          playerData = p;

          processedMatches++;

          console.log(`🎯 Player found → ${player.nickname}`);
          console.log(
            `Kills: ${k} | Deaths: ${d} | ADR: ${a} | HS%: ${hs}`
          );

          // ======================
          // WEAPON STATS
          // ======================

          for (const [weapon, wKills] of getWeaponKills(p.player_stats)) {
            if (typeof weapon !== 'string' || !weapon.trim()) {
              continue;
            }

            weaponStats[weapon] =
              (weaponStats[weapon] || 0) + n(wKills);
          }

          // ======================
          // MAP STATS
          // ======================

          if (!mapStats[mapName]) {

            mapStats[mapName] = {
              matches: 0,
              wins: 0,
              kills: 0,
              deaths: 0
            };
          }

          mapStats[mapName].matches++;
          mapStats[mapName].kills += k;
          mapStats[mapName].deaths += d;

          if (win) {
            mapStats[mapName].wins++;
          }
        }
      }

      // ======================
      // MATCH DETAILS
      // ======================

      if (found && playerData) {

        form.push(matchWin ? 1 : 0);

        const scoreObj = match.results?.score;

        let scoreStr = 'N/A';

        if (scoreObj && typeof scoreObj === 'object') {

          const faction1 =
            scoreObj.faction1 ||
            scoreObj.team1 ||
            0;

          const faction2 =
            scoreObj.faction2 ||
            scoreObj.team2 ||
            0;

          scoreStr = `${faction1}-${faction2}`;
        }

        matchDetails.push({

          date: match.started_at
            ? new Date(match.started_at * 1000)
            : new Date(),

          map: mapName,

          score: scoreStr,

          kills: n(playerData.player_stats?.Kills),

          assists: n(playerData.player_stats?.Assists),

          deaths: n(playerData.player_stats?.Deaths),

          adr: n(playerData.player_stats?.ADR),

          hsPercent:
            n(playerData.player_stats?.['Headshots %']) ||
            n(playerData.player_stats?.['Headshot %']) ||
            0,

          won: matchWin
        });

        console.log(`📝 Match added`);
      }

    } catch (err) {

      console.log('⚠️ Match error:', err.message);
      continue;
    }
  }

  // ======================
  // FINAL STATS
  // ======================

  const kd =
    deaths > 0
      ? +(kills / deaths).toFixed(2)
      : kills;

  const winRate =
    processedMatches > 0
      ? +((wins / processedMatches) * 100).toFixed(1)
      : 0;

  const avgKills =
    processedMatches > 0
      ? +(kills / processedMatches).toFixed(1)
      : 0;

  const avgDeaths =
    processedMatches > 0
      ? +(deaths / processedMatches).toFixed(1)
      : 0;

  const avgAdr =
    processedMatches > 0
      ? +(adr / processedMatches).toFixed(1)
      : 0;

  const avgHsPercent =
    processedMatches > 0
      ? +(hsPercent / processedMatches).toFixed(1)
      : 0;

  const avgClutchSuccess =
    processedMatches > 0
      ? +(clutchSuccess / processedMatches).toFixed(1)
      : 0;

  const avgEntrySuccess =
    processedMatches > 0
      ? +(entrySuccess / processedMatches).toFixed(1)
      : 0;

  // ======================
  // RATING
  // ======================

  const performance =
    (kd * 0.6) +
    ((winRate / 100) * 0.4);

  const rating =
    +performance.toFixed(2);

  // ======================
  // WEAPON ARRAY
  // ======================

  const weaponStatsArray = Object
    .entries(weaponStats)
    .map(([name, kills]) => ({
      name,
      kills,
      hsPercent: 0,
      totalDamage: 0
    }))
    .sort((a, b) => b.kills - a.kills);

  if (weaponStatsArray.length === 0 && processedMatches > 0) {
    console.warn(
      'FACEIT returned no per-weapon kill stats. Available player stat fields:',
      lastPlayerStatsKeys
    );
  }

  // ======================
  // MAP ARRAY
  // ======================

  const mapStatsArray = Object
    .entries(mapStats)
    .map(([name, stats]) => ({

      name,

      matches: stats.matches,

      winRate:
        stats.matches > 0
          ? +((stats.wins / stats.matches) * 100).toFixed(1)
          : 0,

      kd:
        stats.deaths > 0
          ? +(stats.kills / stats.deaths).toFixed(2)
          : stats.kills

    }))
    .sort((a, b) => b.matches - a.matches);

  // ======================
  // FINAL LOG
  // ======================

  console.log('\n📊 FINAL FACEIT STATS');
  console.log('----------------------');

  console.log('Kills:', kills);
  console.log('Deaths:', deaths);

  console.log('Wins:', wins);
  console.log('Matches:', processedMatches);

  console.log('K/D:', kd);

  console.log('WinRate:', winRate + '%');

  console.log('Avg Kills:', avgKills);
  console.log('Avg Deaths:', avgDeaths);

  console.log('ADR:', avgAdr);

  console.log('HS%:', avgHsPercent);

  console.log('Rating:', rating);

  console.log('Form:', form.slice(0, 10));

  console.log('======================\n');

  // ======================
  // RETURN
  // ======================

  return {

    kills,
    deaths,

    wins,
    matches: processedMatches,

    kd,
    winRate,

    avgKills,
    avgDeaths,

    avgAdr,
    avgHsPercent,

    avgClutchSuccess,
    avgEntrySuccess,

    rating,

    form: form.slice(0, 10),

    weaponStats: weaponStatsArray,

    mapStats: mapStatsArray,

    matchDetails: matchDetails.slice(0, 100)
  };
}

module.exports = {
  getCsStats
};