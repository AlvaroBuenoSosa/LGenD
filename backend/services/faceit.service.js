const axios = require('axios');

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

const headers = {
  Authorization: `Bearer ${FACEIT_API_KEY}`
};

async function getFaceitPlayerBySteamId(steamId) {
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

  const statsRes = await axios.get(
    `https://open.faceit.com/data/v4/players/${player.player_id}/stats/cs2`,
    { headers }
  );

  return {
    profile: player,
    stats: statsRes.data || null
  };
}

module.exports = { getFaceitPlayerBySteamId };
