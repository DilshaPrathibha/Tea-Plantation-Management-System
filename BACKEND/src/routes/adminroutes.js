import express from "express";
import { createUser, listUsers, updateUser, resetPassword, deleteUser } from '../controllers/admincontroller.js';
const router = express.Router();
router.post('/users', createUser);
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.post('/users/:id/reset-password', resetPassword);
router.delete('/users/:id', deleteUser);
export default router;
