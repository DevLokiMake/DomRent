import express from 'express';
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
} from '../controllers/propertyController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validate, propertySchema, updatePropertySchema } from '../middlewares/validate.js';

const router = express.Router();

/**
 * POST /api/properties
 * Создание нового объекта (требует аутентификацию и роль LANDLORD)
 */
router.post('/', authenticateToken, validate(propertySchema), createProperty);

/**
 * GET /api/properties
 * Получение всех объектов с фильтрацией (публичный)
 * Query параметры: city, minPrice, maxPrice, type
 */
router.get('/', getAllProperties);

/**
 * GET /api/properties/:id
 * Получение объекта по ID (публичный)
 */
router.get('/:id', getPropertyById);

/**
 * PUT /api/properties/:id
 * Обновление объекта (требует аутентификацию и владельца)
 */
router.put('/:id', authenticateToken, validate(updatePropertySchema), updateProperty);

/**
 * DELETE /api/properties/:id
 * Удаление объекта (требует аутентификацию и владельца)
 */
router.delete('/:id', authenticateToken, deleteProperty);

export default router;