const axios = require('axios');

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

const headers = {
  Authorization: `Bearer ${FACEIT_API_KEY}`
};

// ======================
// HELPERS
// ======================
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

// SAFE NUMBER
function n(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

// MAP ID TO NAME
const MAP_NAMES = {
  1: 'Dust2',
  2: 'Mirage',
  3: 'Inferno',
  4: 'Cache',
  5: 'Overpass',
  6: 'Nuke',
  7: 'Train',
  8: 'Vertigo',
  9: 'Ancient',
  10: 'Anubis',
  11: 'Office'
};

function getMapName(mapId) {
  const id = n(mapId);
  return MAP_NAMES[id] || 'Unknown';
}

// ======================
// MAIN FUNCTION
// ======================
async function getCsStats(steamId) {

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
  if (!player?.player_id) return null;

  console.log("\n==============================");
  console.log("🔍 CSSTATS START:", steamId);
  console.log("==============================");

  console.log("👤 Player:", player.nickname);
  console.log("🆔 ID:", player.player_id);

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
  console.log("📦 Matches:", matches.length);

  let kills = 0;
  let deaths = 0;
  let wins = 0;
  let adr = 0;
  let hsPercent = 0;
  let clutchSuccess = 0;
  let entrySuccess = 0;

  let form = [];
  let processedMatches = 0;

  let weaponStats = {};
  let mapStats = {};
  let matchDetails = [];

  for (const match of matches) {

    try {
      const statsRes = await axios.get(
        `https://open.faceit.com/data/v4/matches/${match.match_id}/stats`,
        { headers }
      );

      const round = statsRes.data?.rounds?.[0];

      if (!round || !round.teams) {
        console.log("⚠️ Invalid match data");
        continue;
      }

      const mapName = round?.round_stats?.Map || match?.results?.Map || 'Unknown';

      const teams = round.teams;

      let found = false;
      let matchWin = false;
      let playerData = null;

      console.log(`\n🎮 MATCH: ${match.match_id}`);

      for (const team of teams) {

        const win = isWinningTeam(team);

        for (const p of team.players || []) {

          if (p.player_id === player.player_id) {

            const k = n(p.player_stats?.Kills);
            const d = n(p.player_stats?.Deaths);
            const a = n(p.player_stats?.ADR);
            const hs = n(p.player_stats?.['Headshot %']);
            const clutch = n(p.player_stats?.['Clutch Success %']);
            const entry = n(p.player_stats?.['Entry Success %']);

            kills += k;
            deaths += d;
            adr += a;
            hsPercent += hs;
            clutchSuccess += clutch;
            entrySuccess += entry;

            found = true;
            matchWin = win;
            playerData = p;

            console.log(`🎯 Player found → ${player.nickname}`);
            console.log(`   Kills: ${k} | Deaths: ${d} | ADR: ${a} | HS%: ${hs}`);

            if (win) wins++;

            if (p.player_stats?.['Weapon Kills']) {
              const weaponKills = p.player_stats['Weapon Kills'];
              for (const [weapon, wKills] of Object.entries(weaponKills)) {
                weaponStats[weapon] = (weaponStats[weapon] || 0) + n(wKills);
              }
            }

            const mapId = match.i1;
            const mapNameFromRound = getMapName(match.i1) || match.map || 'Unknown';
            console.log(`🔍 Map ID: ${mapId}, Map Name: ${match.map}, Final: ${mapNameFromRound}`);
            if (!mapStats[mapName]) {
              mapStats[mapName] = { matches: 0, wins: 0, kills: 0, deaths: 0 };
            }
            mapStats[mapName].matches++;
            mapStats[mapName].kills += k;
            mapStats[mapName].deaths += d;
            if (win) mapStats[mapName].wins++;
          }
        }
      }

      if (found) {
        form.push(matchWin ? 1 : 0);
        processedMatches++;

        const scoreObj = match.results?.score;
        let scoreStr = 'N/A';
        if (scoreObj && typeof scoreObj === 'object') {
          const faction1 = scoreObj.faction1 || scoreObj.team1 || 0;
          const faction2 = scoreObj.faction2 || scoreObj.team2 || 0;
          scoreStr = `${faction1}-${faction2}`;
        }

        matchDetails.push({
          date: match.started_at ? new Date(match.started_at * 1000) : new Date(),
          map: mapName,
          score: scoreStr,
          kills: playerData.player_stats?.Kills || 0,
          assists: playerData.player_stats?.Assists || 0,
          deaths: playerData.player_stats?.Deaths || 0,
          adr: playerData.player_stats?.ADR || 0,
          won: matchWin
        });
        
        console.log(`📝 Match Detail - Map from round: ${mapName}`);
      } else {
        console.log("❌ Player not found in match");
      }

    } catch (err) {
      console.log("⚠️ Match error:", err.message);
      continue;
    }
  }

  const avgAdr = processedMatches ? +(adr / processedMatches).toFixed(1) : 0;
  const avgHsPercent = processedMatches ? +(hsPercent / processedMatches).toFixed(1) : 0;
  const avgClutchSuccess = processedMatches ? +(clutchSuccess / processedMatches).toFixed(1) : 0;
  const avgEntrySuccess = processedMatches ? +(entrySuccess / processedMatches).toFixed(1) : 0;

  const kd = deaths > 0 ? +(kills / deaths).toFixed(2) : kills;

  const winRate = processedMatches
    ? +(wins / processedMatches * 100).toFixed(1)
    : 0;

  const avgKills = processedMatches
    ? +(kills / processedMatches).toFixed(1)
    : 0;

  const avgDeaths = processedMatches
    ? +(deaths / processedMatches).toFixed(1)
    : 0;

  const performance =
    (kd * 0.6) +
    ((winRate / 100) * 0.4);

  const rating = +performance.toFixed(2);

  const recentForm = form.slice(0, 10);

  const weaponStatsArray = Object.entries(weaponStats).map(([name, kills]) => ({
    name,
    kills,
    hsPercent: 0,
    totalDamage: 0
  })).sort((a, b) => b.kills - a.kills);

  const mapStatsArray = Object.entries(mapStats).map(([name, stats]) => ({
    name,
    matches: stats.matches,
    winRate: stats.matches ? +(stats.wins / stats.matches * 100).toFixed(1) : 0,
    kd: stats.deaths > 0 ? +(stats.kills / stats.deaths).toFixed(2) : stats.kills
  })).sort((a, b) => b.matches - a.matches);

  console.log("\n📊 FINAL FACEIT STATS");
  console.log("----------------------");
  console.log("Kills:", kills);
  console.log("Deaths:", deaths);
  console.log("Wins:", wins);
  console.log("Matches:", processedMatches);
  console.log("K/D:", kd);
  console.log("WinRate:", winRate + "%");
  console.log("Avg Kills:", avgKills);
  console.log("Avg Deaths:", avgDeaths);
  console.log("ADR:", avgAdr);
  console.log("HS%:", avgHsPercent);
  console.log("Rating:", rating);
  console.log("Form:", recentForm);
  console.log("======================\n");

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

    form: recentForm,

    weaponStats: weaponStatsArray,
    mapStats: mapStatsArray,
    matchDetails: matchDetails.slice(0, 100)
  };
}

module.exports = { getCsStats };
