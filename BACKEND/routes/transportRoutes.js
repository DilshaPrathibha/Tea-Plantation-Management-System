const express = require('express');
const router = express.Router();
const {
  getAllTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
} = require('../src/controllers/transportController');


router.get('/', getAllTransports);

router.get('/:id', getTransportById);

router.post('/', createTransport);

router.put('/:id', updateTransport);

router.delete('/:id', deleteTransport);

module.exports = router;