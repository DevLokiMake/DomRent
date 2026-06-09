import express from 'express';
import { getNotifications, markAllRead, markOneRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// GET  /api/notifications        — список уведомлений
router.get('/', authenticateToken, getNotifications);

// PATCH /api/notifications/read-all — прочитать все
router.patch('/read-all', authenticateToken, markAllRead);

// PATCH /api/notifications/:id/read — прочитать одно
router.patch('/:id/read', authenticateToken, markOneRead);

export default router;
