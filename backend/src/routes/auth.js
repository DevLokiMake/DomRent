import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 * Body: { email, password, name?, phone?, role? }
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Вход пользователя
 * Body: { email, password }
 */
router.post('/login', login);

export default router;
