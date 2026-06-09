import { PrismaClient } from '@prisma/client';
import { createNotification } from './notificationController.js';

const prisma = new PrismaClient();

// ─── Статистика ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Базовая статистика платформы
 */
export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      pendingProperties,
      totalRevenue,
      bannedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.booking.count(),
      prisma.property.count({ where: { status: 'PENDING' } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true } }),
      prisma.user.count({ where: { isBanned: true } }),
    ]);

    // Новые за последние 7 дней
    const since7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newUsers7d, newBookings7d] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since7days } } }),
      prisma.booking.count({ where: { createdAt: { gte: since7days } } }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProperties,
        totalBookings,
        pendingProperties,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        bannedUsers,
        newUsers7d,
        newBookings7d,
      }
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
};

// ─── Управление пользователями ────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Список всех пользователей
 */
export const getUsers = async (req, res) => {
  try {
    const { search, role, banned, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (banned === 'true') where.isBanned = true;
    if (banned === 'false') where.isBanned = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, phone: true,
          role: true, isBanned: true, createdAt: true,
          _count: { select: { bookings: true, properties: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
};

/**
 * PATCH /api/admin/users/:id/ban
 * Заблокировать / разблокировать пользователя
 * Body: { banned: boolean }
 */
export const toggleUserBan = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Некорректный ID' });

    const { banned } = req.body;
    if (typeof banned !== 'boolean') {
      return res.status(400).json({ error: 'Поле banned должно быть boolean' });
    }

    // Нельзя заблокировать самого себя или другого администратора
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
    }
    if (target.role === 'ADMIN') {
      return res.status(400).json({ error: 'Нельзя заблокировать другого администратора' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBanned: banned },
      select: { id: true, email: true, name: true, role: true, isBanned: true }
    });

    res.json({
      message: banned ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
      user
    });
  } catch (error) {
    console.error('toggleUserBan error:', error);
    res.status(500).json({ error: 'Ошибка при изменении статуса пользователя' });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Изменить роль пользователя
 * Body: { role: 'USER' | 'LANDLORD' | 'ADMIN' }
 */
export const changeUserRole = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    const validRoles = ['USER', 'LANDLORD', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Допустимые роли: ${validRoles.join(', ')}` });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true }
    });

    res.json({ message: 'Роль обновлена', user });
  } catch (error) {
    console.error('changeUserRole error:', error);
    res.status(500).json({ error: 'Ошибка при изменении роли' });
  }
};

// ─── Модерация объявлений ─────────────────────────────────────────────────────

/**
 * GET /api/admin/properties
 * Все объявления с фильтром по статусу модерации
 */
export const getPropertiesAdmin = async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          city: { select: { id: true, name: true } },
          _count: { select: { bookings: true, reviews: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.property.count({ where }),
    ]);

    res.json({ properties, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('getPropertiesAdmin error:', error);
    res.status(500).json({ error: 'Ошибка получения объявлений' });
  }
};

/**
 * PATCH /api/admin/properties/:id/approve
 * Одобрить объявление
 */
export const approveProperty = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) return res.status(400).json({ error: 'Некорректный ID' });

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: { status: 'APPROVED', rejectionReason: null },
      include: { owner: { select: { id: true, name: true } } }
    });

    // Уведомить арендодателя
    await createNotification(
      property.ownerId,
      'PROPERTY_APPROVED',
      '✅ Объявление одобрено',
      `Ваше объявление «${property.title}» прошло модерацию и теперь видно в поиске`,
      propertyId
    );

    res.json({ message: 'Объявление одобрено', property });
  } catch (error) {
    console.error('approveProperty error:', error);
    res.status(500).json({ error: 'Ошибка при одобрении' });
  }
};

/**
 * PATCH /api/admin/properties/:id/reject
 * Отклонить объявление с указанием причины
 * Body: { reason: string }
 */
export const rejectProperty = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) return res.status(400).json({ error: 'Некорректный ID' });

    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Укажите причину отклонения' });
    }

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: { status: 'REJECTED', rejectionReason: reason.trim() },
      include: { owner: { select: { id: true, name: true } } }
    });

    // Уведомить арендодателя
    await createNotification(
      property.ownerId,
      'PROPERTY_REJECTED',
      '❌ Объявление отклонено',
      `Объявление «${property.title}» отклонено. Причина: ${reason.trim()}`,
      propertyId
    );

    res.json({ message: 'Объявление отклонено', property });
  } catch (error) {
    console.error('rejectProperty error:', error);
    res.status(500).json({ error: 'Ошибка при отклонении' });
  }
};
