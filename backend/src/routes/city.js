import express from 'express';
import { getAllCities } from '../controllers/cityController.js';

const router = express.Router();

/**
 * GET /api/cities
 * Получение всех городов (публичный)
 */
router.get('/', getAllCities);

export default router;
