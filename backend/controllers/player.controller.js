const {
  getSteamPlayer
} = require('../services/steam.service');
const { getFaceitPlayerBySteamId } = require('../services/faceit.service');
const { getCsStats } = require('../services/csstats.service');
const { getFaceitWeaponStatsStatus } = require('../services/faceit-weapon-demos.service');
const { getCsStatsGGWeaponStatsStatus } = require('../services/csstatsgg.service');

async function getPlayer(req, res) {

  const { steamId } = req.params;

  try {

    const [steam, faceit, performance] = await Promise.all([

      getSteamPlayer(steamId).catch(error => {
        console.warn('Steam profile lookup failed:', error.message);
        return null;
      }),

      getFaceitPlayerBySteamId(steamId).catch(error => {
        console.warn('FACEIT profile lookup failed:', error.message);
        return null;
      }),

      getCsStats(steamId).catch(error => {
        console.warn('FACEIT career stats lookup failed:', error.message);
        return null;
      })

    ]);

    // =========================
    // REAL FACEIT STRUCTURE
    // =========================

    const profile =
      faceit?.profile || {};

    const cs2 =
      profile?.games?.cs2 || {};

    // =========================
    // RESPONSE
    // =========================

    return res.json({

      steamId,

      name:

        steam?.personaname ||

        profile?.nickname ||

        'Unknown',

      avatar:

        steam?.avatarfull ||

        profile?.avatar ||

        null,

      profileUrl:

        steam?.profileurl ||

        null,

      // =========================
      // FACEIT
      // =========================

      faceit: {

        // REAL FIX
        elo:

          Number(
            cs2?.faceit_elo || 0
          ),

        // REAL FIX
        level:

          Number(
            cs2?.skill_level || 1
          ),

        profile: {

          nickname:

            profile?.nickname ||

            'Unknown',

          country:

            profile?.country ||

            'Unknown',

          url:

            `https://www.faceit.com/en/players/${profile?.nickname}`

        },

        lifetime: {

          kills:

            Number(
              performance?.kills || 0
            ),

          deaths:

            Number(
              performance?.deaths || 0
            ),

          matches:

            Number(
              performance?.matches || 0
            ),

          wins:

            Number(
              performance?.wins || 0
            ),

          kd:

            Number(
              performance?.kd || 0
            ),

          adr:

            Number(
              performance?.avgAdr || 0
            ),

          hsPercent:

            Number(
              performance?.avgHsPercent || 0
            ),

          winRate:

            Number(
              performance?.winRate || 0
            )

        }

      },

      // =========================
      // PERFORMANCE
      // =========================

      faceitPerformance:

        {
          ...(performance || {}),
          weaponStats: performance?.weaponStats || { mostKills: [], hsPercent: [] }
        },

      csstats:

        performance || {},

      // =========================
      // GLOBAL STATS
      // =========================

      stats: {

        kd:
          performance?.kd || 0,

        adr:
          performance?.avgAdr || 0,

        winRate:
          performance?.winRate || 0,

        matches:
          performance?.matches || 0,

        wins:
          performance?.wins || 0,

        hs:
          performance?.avgHsPercent || 0,

        rating:
          performance?.rating || 0


      }

    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: 'Failed to fetch player'
    });

  }

}

async function getPlayerWeaponStats(req, res) {
  const { steamId } = req.params;

  if (!/^\d{17}$/.test(steamId)) {
    return res.status(400).json({ error: 'Invalid Steam ID' });
  }

  try {
    return res.json(await getFaceitWeaponStatsStatus(steamId));
  } catch (error) {
    console.error('Failed to get FACEIT weapon analysis status:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve FACEIT weapon analysis status'
    });
  }
}

function getPlayerMatchmakingWeaponStats(req, res) {
  const { steamId } = req.params;

  if (!/^\d{17}$/.test(steamId)) {
    return res.status(400).json({ error: 'Invalid Steam ID' });
  }

  return res.json(getCsStatsGGWeaponStatsStatus(steamId));
}

module.exports = {
  getPlayer,
  getPlayerWeaponStats,
  getPlayerMatchmakingWeaponStats
};