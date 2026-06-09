import express from 'express';
import { createReview, getPropertyReviews, canReview } from '../controllers/reviewController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/reviews                          — создать отзыв
router.post('/', authenticateToken, createReview);

// GET  /api/reviews/property/:propertyId     — отзывы объекта
router.get('/property/:propertyId', getPropertyReviews);

// GET  /api/reviews/can-review/:bookingId    — проверка права на отзыв
router.get('/can-review/:bookingId', authenticateToken, canReview);

export default router;
