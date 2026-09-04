const express = require('express');
const router = express.Router();
const { handleChatMessage, getChatSuggestions } = require('../controllers/chatController');

router.post('/message', handleChatMessage);
router.get('/suggestions', getChatSuggestions);

module.exports = router;
