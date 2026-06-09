import express from 'express';
import {
  getStats,
  getUsers,
  toggleUserBan,
  changeUserRole,
  getPropertiesAdmin,
  approveProperty,
  rejectProperty,
  getAuditLog,
} from '../controllers/adminController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/requireRole.js';

const router = express.Router();

// Все маршруты защищены: авторизация + роль ADMIN
router.use(authenticateToken, requireAdmin);

// Статистика
router.get('/stats', getStats);

// Пользователи
router.get('/users', getUsers);
router.patch('/users/:id/ban', toggleUserBan);
router.patch('/users/:id/role', changeUserRole);

// Модерация объявлений
router.get('/properties', getPropertiesAdmin);
router.patch('/properties/:id/approve', approveProperty);
router.patch('/properties/:id/reject', rejectProperty);

// Журнал действий администраторов
router.get('/audit', getAuditLog);

export default router;
