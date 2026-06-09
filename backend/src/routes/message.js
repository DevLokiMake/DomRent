import express from 'express';
import { getMessages, sendMessage, getChatList } from '../controllers/messageController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// GET  /api/messages/chats           — список чатов пользователя
router.get('/chats', authenticateToken, getChatList);

// GET  /api/messages/:bookingId      — история сообщений
router.get('/:bookingId', authenticateToken, getMessages);

// POST /api/messages/:bookingId      — отправить сообщение
router.post('/:bookingId', authenticateToken, sendMessage);

export default router;
