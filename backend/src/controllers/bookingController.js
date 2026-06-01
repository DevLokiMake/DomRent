import { PrismaClient } from '@prisma/client';
import { sendBookingNotification } from '../services/telegramService.js';

const prisma = new PrismaClient();

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
 * @param {Object} req - Express request объект (body уже валидирован middleware)
 * @param {Object} res - Express response объект
 */
export const createBooking = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

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
                phone: true,
                telegramId: true
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

    // Отправка уведомления владельцу объекта в отдельном try/catch
    // Чтобы если Telegram временно недоступен, бронирование все равно сохранилось
    try {
      if (booking.property.owner.telegramId) {
        await sendBookingNotification(booking.property.owner.id, {
          propertyTitle: booking.property.title,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          guestName: booking.user.name || 'Не указано',
          guestEmail: booking.user.email,
          guestPhone: booking.user.phone || 'Не указано'
        });
      }
    } catch (telegramError) {
      console.error('Ошибка при отправке Telegram-уведомления:', telegramError.message);
      // Не прерываем выполнение - бронирование уже успешно создано в БД
    }

    // Отправка ответа клиенту
    res.status(201).json({
      message: 'Бронирование успешно создано',
      booking
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

/**
 * Получение всех бронирований объектов владельца
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const getOwnerBookings = async (req, res) => {
  try {
    // Получение всех объектов, которыми владеет пользователь
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    if (propertyIds.length === 0) {
      return res.json({
        count: 0,
        bookings: []
      });
    }

    // Получение всех бронирований для этих объектов
    const bookings = await prisma.booking.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
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
    console.error('Get owner bookings error:', error);
    res.status(500).json({ error: 'Ошибка при получении бронирований' });
  }
};