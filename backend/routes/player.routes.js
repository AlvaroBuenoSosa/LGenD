const express = require('express');
const router = express.Router();

const { getPlayer } = require('../controllers/player.controller');

router.get('/player/:steamId', getPlayer);

module.exports = router;
