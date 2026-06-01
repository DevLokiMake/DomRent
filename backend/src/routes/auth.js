import express from 'express';
import { register, login } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema } from '../middlewares/validate.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 * Body: { email, password, name?, phone?, role? }
 */
router.post('/register', validate(registerSchema), register);

/**
 * POST /api/auth/login
 * Вход пользователя
 * Body: { email, password }
 */
router.post('/login', validate(loginSchema), login);

export default router;
