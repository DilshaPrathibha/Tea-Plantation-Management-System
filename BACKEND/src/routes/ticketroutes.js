// BACKEND/src/routes/ticketroutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireAnyRole } = require('../middleware/auth');
const {
  createTicket,
  listMyTickets,
  updateMyTicket,
  deleteMyTicket,
  adminListTickets,
  adminUpdateTicket
} = require('../controllers/ticketcontroller');

const CREATOR_ROLES = ['inventory_manager', 'production_manager', 'field_supervisor'];

router.post('/', verifyToken, requireAnyRole(CREATOR_ROLES), createTicket);
router.get('/my', verifyToken, requireAnyRole(CREATOR_ROLES), listMyTickets);
router.patch('/:id', verifyToken, requireAnyRole(CREATOR_ROLES), updateMyTicket);
router.delete('/:id', verifyToken, requireAnyRole(CREATOR_ROLES), deleteMyTicket);

router.get('/', verifyToken, requireAnyRole(['admin']), adminListTickets);
router.patch('/:id/status', verifyToken, requireAnyRole(['admin']), adminUpdateTicket);

module.exports = router;
