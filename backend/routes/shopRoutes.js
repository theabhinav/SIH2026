const express = require('express');
const router = express.Router();
const { createShop, getShops, upvoteShop, getLeaderboard } = require('../controllers/shopController');
const { authenticateToken, optionalToken } = require('../middleware/auth');

router.post('/shops', authenticateToken, createShop);
router.get('/shops', optionalToken, getShops);
router.post('/shops/:id/upvote', authenticateToken, upvoteShop);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
