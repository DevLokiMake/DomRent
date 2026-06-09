import express from 'express';
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getNearbyProperties
} from '../controllers/propertyController.js';
import {
  getBlockedDates,
  addBlockedDates,
  removeBlockedDates
} from '../controllers/blockedDateController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validate, propertySchema, updatePropertySchema } from '../middlewares/validate.js';

const router = express.Router();

// Опциональная авторизация: прикрепляет req.user если токен есть, но не падает без него
const optionalAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return next();
  try {
    await authenticateToken(req, res, next);
  } catch {
    next();
  }
};

// POST /api/properties — Создание (только LANDLORD/ADMIN)
router.post('/', authenticateToken, validate(propertySchema), createProperty);

// GET /api/properties — Все объекты с фильтрацией (публичный)
router.get('/', getAllProperties);

// GET /api/properties/nearby — Поиск рядом (MUST be before /:id)
router.get('/nearby', getNearbyProperties);

// GET /api/properties/:id — Объект по ID (опциональная авторизация для статуса модерации)
router.get('/:id', optionalAuth, getPropertyById);

// PUT /api/properties/:id — Обновление (владелец)
router.put('/:id', authenticateToken, validate(updatePropertySchema), updateProperty);

// DELETE /api/properties/:id — Удаление (владелец)
router.delete('/:id', authenticateToken, deleteProperty);

// ─── Календарь занятости ───────────────────────────────────────────────
// GET  /api/properties/:id/blocked-dates — публичный (для формы бронирования)
router.get('/:id/blocked-dates', getBlockedDates);
// POST /api/properties/:id/blocked-dates — ручная блокировка (владелец/admin)
router.post('/:id/blocked-dates', authenticateToken, addBlockedDates);
// DELETE /api/properties/:id/blocked-dates — снять блокировку (владелец/admin)
router.delete('/:id/blocked-dates', authenticateToken, removeBlockedDates);

export default router;
