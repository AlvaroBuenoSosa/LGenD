const axios = require('axios');

const STEAM_API_KEY = process.env.STEAM_API_KEY;

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

module.exports = { getSteamPlayer };
