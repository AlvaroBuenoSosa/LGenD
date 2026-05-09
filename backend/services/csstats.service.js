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

          if (p.player_stats?.['Weapon Kills']) {

            const weaponKills = p.player_stats['Weapon Kills'];

            for (const [weapon, wKills] of Object.entries(weaponKills)) {

              weaponStats[weapon] =
                (weaponStats[weapon] || 0) + n(wKills);
            }
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