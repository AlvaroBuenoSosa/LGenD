const { getSteamPlayer } = require('./steam.service');
const { getFaceitPlayerBySteamId } = require('./faceit.service');
const { getCsStats } = require('./csstats.service');

async function getPlayerFullProfile(steamId) {
  const [steam, faceit, csstats] = await Promise.all([
    getSteamPlayer(steamId).catch(() => null),
    getFaceitPlayerBySteamId(steamId).catch(() => null),
    getCsStats(steamId).catch(() => null)
  ]);

  return {
    steam,
    faceit,
    csstats
  };
}

module.exports = { getPlayerFullProfile };
