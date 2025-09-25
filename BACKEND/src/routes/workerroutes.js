// BACKEND/src/routes/workerroutes.js
const express = require('express');
const router = express.Router();

const { verifyToken, requireAnyRole } = require('../middleware/auth');
const { summary, notify } = require('../controllers/workercontroller');

router.use(verifyToken, requireAnyRole(['worker']));

router.get('/summary', summary);
router.post('/notify', notify);

module.exports = router;
