import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Утилита: создать уведомление (используется внутри других контроллеров)
 */
export const createNotification = async (userId, type, title, body, entityId = null) => {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, body, entityId }
    });
  } catch (err) {
    console.error('createNotification error:', err);
  }
};

/**
 * GET /api/notifications
 * Все уведомления текущего пользователя (последние 50)
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ unreadCount, notifications });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Отметить все уведомления пользователя как прочитанные
 */
export const markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'Все уведомления прочитаны' });
  } catch (error) {
    console.error('markAllRead error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Прочитать одно уведомление
 */
export const markOneRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true }
    });
    res.json({ message: 'Уведомление прочитано' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
  }
};
