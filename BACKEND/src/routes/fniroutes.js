import express from 'express';
import {
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  adjustStock
} from '../controllers/fnicontroller.js';

const router = express.Router();

router.post('/items', createItem);
router.get('/items', listItems);
router.get('/items/:id', getItem);
router.patch('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);
router.post('/items/:id/adjust', adjustStock);

export default router;
