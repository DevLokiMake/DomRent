import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Генерирует массив дат между start и end (включительно)
 * @param {Date} start
 * @param {Date} end
 * @returns {Date[]}
 */
const getDatesInRange = (start, end) => {
  const dates = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
};

/**
 * GET /api/properties/:id/blocked-dates
 * Возвращает все заблокированные даты объекта:
 * — ручная блокировка хозяином
 * — даты активных/предстоящих бронирований
 */
export const getBlockedDates = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) return res.status(400).json({ error: 'Некорректный ID' });

    // 1. Вручную заблокированные даты
    const manualBlocked = await prisma.blockedDate.findMany({
      where: { propertyId },
      select: { date: true, reason: true }
    });

    // 2. Даты из активных/предстоящих бронирований
    const activeBookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ['UPCOMING', 'ACTIVE'] }
      },
      select: { startDate: true, endDate: true }
    });

    // Собираем все заблокированные даты в Set (ISO string yyyy-mm-dd)
    const blockedSet = new Set();

    manualBlocked.forEach(b => {
      blockedSet.add(new Date(b.date).toISOString().split('T')[0]);
    });

    activeBookings.forEach(booking => {
      const range = getDatesInRange(booking.startDate, booking.endDate);
      range.forEach(d => blockedSet.add(d.toISOString().split('T')[0]));
    });

    res.json({ blockedDates: Array.from(blockedSet).sort() });
  } catch (error) {
    console.error('getBlockedDates error:', error);
    res.status(500).json({ error: 'Ошибка получения заблокированных дат' });
  }
};

/**
 * POST /api/properties/:id/blocked-dates
 * Арендодатель вручную блокирует даты
 * Body: { dates: string[], reason?: string }
 */
export const addBlockedDates = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) return res.status(400).json({ error: 'Некорректный ID' });

    // Проверка: только владелец или admin
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true }
    });
    if (!property) return res.status(404).json({ error: 'Объект не найден' });
    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Нет прав для управления этим объектом' });
    }

    const { dates, reason = 'manual' } = req.body;
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Передайте массив дат' });
    }

    // Upsert каждую дату (игнорировать дубли)
    const results = await Promise.allSettled(
      dates.map(d =>
        prisma.blockedDate.upsert({
          where: { propertyId_date: { propertyId, date: new Date(d) } },
          create: { propertyId, date: new Date(d), reason },
          update: { reason }
        })
      )
    );

    const added = results.filter(r => r.status === 'fulfilled').length;

    res.json({ message: `Заблокировано дат: ${added}`, total: added });
  } catch (error) {
    console.error('addBlockedDates error:', error);
    res.status(500).json({ error: 'Ошибка блокировки дат' });
  }
};

/**
 * DELETE /api/properties/:id/blocked-dates
 * Арендодатель снимает ручную блокировку дат
 * Body: { dates: string[] }
 */
export const removeBlockedDates = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) return res.status(400).json({ error: 'Некорректный ID' });

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true }
    });
    if (!property) return res.status(404).json({ error: 'Объект не найден' });
    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Нет прав' });
    }

    const { dates } = req.body;
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Передайте массив дат' });
    }

    const { count } = await prisma.blockedDate.deleteMany({
      where: {
        propertyId,
        date: { in: dates.map(d => new Date(d)) },
        reason: 'manual' // Только ручные блокировки, не от бронирований
      }
    });

    res.json({ message: `Разблокировано дат: ${count}`, count });
  } catch (error) {
    console.error('removeBlockedDates error:', error);
    res.status(500).json({ error: 'Ошибка разблокировки дат' });
  }
};
