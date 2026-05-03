const { getSteamPlayer } = require('../services/steam.service');
const { getFaceitPlayerBySteamId } = require('../services/faceit.service');
const { getCsStats } = require('../services/csstats.service');

// =========================
// TIMEOUT PROTECTION
// =========================
const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  );

const n = (v) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
};

const safeCall = (promise, label, ms = 5000) =>
  Promise.race([promise, timeout(ms)])
    .then(res => res)
    .catch(err => {
      console.warn(`⚠️ ${label} failed:`, err?.message || err);
      return null;
    });

// =========================
// DEFAULT STATS (ANTI-CRASH)
// =========================
const defaultStats = {
  kd: 0,
  adr: 0,
  winRate: 0,
  matches: 0,
  wins: 0,
  hs: 0,
  rating: 0
};

// =========================
// CONTROLLER
// =========================
async function getPlayer(req, res) {
  const { steamId } = req.params;
  const timestamp = req.query.t;

  console.log("🌐 REQUEST:", steamId, "T:", timestamp);

  try {

    // =========================
    // FETCH PARALLEL (SAFE)
    // =========================
    const [steam, faceit, csstats] = await Promise.all([
      safeCall(getSteamPlayer(steamId), 'Steam', 5000),
      safeCall(getFaceitPlayerBySteamId(steamId), 'Faceit', 15000),
      safeCall(getCsStats(steamId), 'CSStats', 20000)
    ]);

    // =========================
    // BUILD GLOBAL STATS (CRUCIAL)
    // =========================
    const faceitLifetime = faceit?.stats?.lifetime ?? {};

    const stats = csstats
      ? {
          kd: csstats.kd ?? 0,
          adr: csstats.adr ?? 0,
          winRate: csstats.winRate ?? 0,
          matches: csstats.matches ?? 0,
          wins: csstats.wins ?? 0,
          hs: csstats.hs ?? 0,
          rating: csstats.rating ?? 0
        }
      : {
          kd: n(faceitLifetime['Average K/D Ratio'] ?? faceitLifetime['K/D Ratio']),
          adr: n(faceitLifetime['ADR']),
          winRate: n(faceitLifetime['Win Rate %'] ?? faceitLifetime['Win Rate']),
          matches: n(faceitLifetime['Matches'] ?? faceitLifetime['Total Matches']),
          wins: n(faceitLifetime['Wins']),
          hs: n(faceitLifetime['Average Headshots %'] ?? faceitLifetime['Total Headshots %']),
          rating: 0
        };

    // =========================
    // RESPONSE
    // =========================
    const response = {
      steam,
      faceit,
      stats, // ✅ NECESARIO PARA ANGULAR
      faceitPerformance: csstats, // 🔥 PRO FEATURE
      csstats
    };

    console.log("✅ RESPONSE:", {
      steam: !!steam,
      faceit: !!faceit,
      stats: !!stats,
      csstats: !!csstats
    });

    return res.json(response);

  } catch (err) {

    console.error("❌ CRITICAL ERROR:", err.message);

    return res.status(500).json({
      steam: null,
      faceit: null,
      stats: defaultStats,
      faceitPerformance: null,
      csstats: null
    });
  }
}

module.exports = { getPlayer };

