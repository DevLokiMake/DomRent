import express from 'express';
import {
  createBooking,
  getUserBookings,
  cancelBooking
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * POST /api/bookings
 * Создание нового бронирования (требует аутентификацию)
 * Body: { propertyId, startDate, endDate }
 */
router.post('/', authenticateToken, createBooking);

/**
 * GET /api/bookings/my
 * Получение всех бронирований текущего пользователя (требует аутентификацию)
 */
router.get('/my', authenticateToken, getUserBookings);

/**
 * DELETE /api/bookings/:id
 * Отмена бронирования (требует аутентификацию и принадлежность бронирования)
 */
router.delete('/:id', authenticateToken, cancelBooking);

export default router;