import express from 'express';
import { upload, uploadImages } from '../controllers/uploadController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/upload/images  — до 20 файлов за раз (только авторизованные)
router.post('/images', authenticateToken, upload.array('images', 20), uploadImages);

export default router;
