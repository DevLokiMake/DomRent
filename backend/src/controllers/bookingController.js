import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendBookingNotification } from '../services/telegramService.js';

const prisma = new PrismaClient();

const bookingSchema = z.object({
  propertyId: z.number().int().positive('ID объекта должен быть положительным числом'),
  startDate: z.string().datetime('Начальная дата должна быть в формате ISO 8601').or(z.date()),
  endDate: z.string().datetime('Конечная дата должна быть в формате ISO 8601').or(z.date())
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  { message: 'Конечная дата должна быть позже начальной даты' }
);

/**
 * Вспомогательная функция: проверка пересечения дат
 * @param {Date} newStart - начало нового бронирования
 * @param {Date} newEnd - конец нового бронирования
 * @param {Array} existingBookings - существующие бронирования
 * @returns {boolean} - true если есть пересечение
 */
const hasDateConflict = (newStart, newEnd, existingBookings) => {
  return existingBookings.some((booking) => {
    return (newStart < booking.endDate) && (newEnd > booking.startDate);
  });
};

/**
 * Вычисление стоимости бронирования
 * @param {Date} startDate - начало бронирования
 * @param {Date} endDate - конец бронирования
 * @param {number} pricePerDay - цена за день
 * @returns {number} - общая стоимость
 */
const calculateTotalPrice = (startDate, endDate, pricePerDay) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return daysCount * pricePerDay;
};

/**
 * Создание нового бронирования
 * Проверяет наличие объекта и пересечения дат
 * Вычисляет totalPrice
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const createBooking = async (req, res) => {
  try {
    // Валидация данных
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message
      });
    }

    const { propertyId } = parsed.data;
    const startDate = new Date(parsed.data.startDate);
    const endDate = new Date(parsed.data.endDate);

    // Проверка существования объекта
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Объект не найден' });
    }

    // Проверка на пересечение дат с существующими бронированиями
    const existingBookings = await prisma.booking.findMany({
      where: { propertyId }
    });

    if (hasDateConflict(startDate, endDate, existingBookings)) {
      return res.status(409).json({
        error: 'На выбранные даты уже есть бронирование. Выберите другие даты.'
      });
    }

    // Вычисление стоимости
    const totalPrice = calculateTotalPrice(startDate, endDate, property.price);

    // Создание бронирования
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        propertyId,
        startDate,
        endDate,
        totalPrice
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            type: true,
            images: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Бронирование успешно создано',
      booking
    });

    // Отправка уведомления владельцу объекта
    await sendBookingNotification(property.ownerId, {
      propertyTitle: property.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      guestName: req.user.name || 'Не указано',
      guestEmail: req.user.email,
      guestPhone: req.user.phone || 'Не указано'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Ошибка при создании бронирования' });
  }
};

/**
 * Получение всех бронирований текущего пользователя
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            city: true,
            price: true,
            type: true,
            images: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    res.json({
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Ошибка при получении бронирований' });
  }
};

/**
 * Отмена/удаление бронирования
 * Может удалить только владелец бронирования
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Валидация ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID бронирования' });
    }

    const bookingId = parseInt(id);

    // Поиск бронирования
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: { title: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }

    // Проверка прав (только владелец бронирования может его отменить)
    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Вы можете отменить только собственные бронирования'
      });
    }

    // Удаление бронирования
    await prisma.booking.delete({
      where: { id: bookingId }
    });

    res.json({
      message: 'Бронирование успешно отменено',
      propertyTitle: booking.property.title
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Ошибка при отмене бронирования' });
  }
};