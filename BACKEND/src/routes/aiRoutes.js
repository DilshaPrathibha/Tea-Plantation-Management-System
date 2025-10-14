const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { analyzePestDisease, testGeminiConnection } = require('../controllers/aiPestAnalysisController');

router.post('/pest-analysis', verifyToken, analyzePestDisease);
router.get('/test', testGeminiConnection); 

module.exports = router;