import express from 'express';
import {
  toggleFavorite,
  getMyFavorites,
  isFavorited
} from '../controllers/favoriteController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * POST /api/favorites/toggle/:propertyId
 * Переключение добавления/удаления объекта из избранного (требует аутентификацию)
 * Если уже в избранном — удалит
 * Если не в избранном — добавит
 */
router.post('/toggle/:propertyId', authenticateToken, toggleFavorite);

/**
 * GET /api/favorites
 * Получение всех избранных объектов пользователя (требует аутентификацию)
 */
router.get('/', authenticateToken, getMyFavorites);

/**
 * GET /api/favorites/check/:propertyId
 * Проверка, добавлен ли объект в избранное (требует аутентификацию)
 */
router.get('/check/:propertyId', authenticateToken, isFavorited);

export default router;