const express = require('express');
const router = express.Router();

const {
  getPlayer,
  getPlayerWeaponStats,
  getPlayerMatchmakingWeaponStats
} = require('../controllers/player.controller');

router.get('/player/:steamId/weapons/matchmaking', getPlayerMatchmakingWeaponStats);
router.get('/player/:steamId/weapons', getPlayerWeaponStats);
router.get('/player/:steamId', getPlayer);

module.exports = router;
