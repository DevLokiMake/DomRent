import express from 'express';
import { generateCode, linkAccount, getTelegramProfile } from '../controllers/telegramController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/telegram/generate-code — authenticated user gets a link code
router.get('/generate-code', authenticateToken, generateCode);

// POST /api/telegram/link — bot verifies the code (no user auth)
router.post('/link', linkAccount);

// GET /api/telegram/profile — bot fetches profile with counts
router.get('/profile', authenticateToken, getTelegramProfile);

export default router;
