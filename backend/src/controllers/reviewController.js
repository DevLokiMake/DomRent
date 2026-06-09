import { PrismaClient } from '@prisma/client';
import { createNotification } from './notificationController.js';

const prisma = new PrismaClient();

/**
 * POST /api/reviews
 * Оставить отзыв — только после завершённой аренды (status COMPLETED)
 */
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, text } = req.body;

    if (!bookingId || !rating || !text?.trim()) {
      return res.status(400).json({ error: 'bookingId, rating и text обязательны' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
    }

    // Проверяем бронирование
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { select: { id: true, title: true, ownerId: true } },
        user: { select: { name: true, email: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Вы можете оставить отзыв только на своё бронирование' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Отзыв можно оставить только после завершения аренды'
      });
    }

    // Проверяем, нет ли уже отзыва
    const existing = await prisma.review.findUnique({
      where: { bookingId }
    });

    if (existing) {
      return res.status(409).json({ error: 'Вы уже оставили отзыв на это бронирование' });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        text: text.trim(),
        authorId: req.user.id,
        propertyId: booking.property.id,
        bookingId
      },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    // Уведомляем арендодателя
    createNotification(
      booking.property.ownerId,
      'REVIEW_NEW',
      '⭐ Новый отзыв',
      `${booking.user.name || booking.user.email} оставил отзыв ${rating}★ на «${booking.property.title}»`,
      review.id
    );

    res.status(201).json({ message: 'Отзыв успешно добавлен', review });
  } catch (error) {
    console.error('createReview error:', error);
    res.status(500).json({ error: 'Ошибка при создании отзыва' });
  }
};

/**
 * GET /api/reviews/property/:propertyId
 * Все отзывы на объект + средний рейтинг
 */
export const getPropertyReviews = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);

    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Некорректный ID объекта' });
    }

    const reviews = await prisma.review.findMany({
      where: { propertyId },
      include: {
        author: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;

    res.json({ count: reviews.length, avgRating, reviews });
  } catch (error) {
    console.error('getPropertyReviews error:', error);
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
};

/**
 * GET /api/reviews/can-review/:bookingId
 * Проверяет, может ли пользователь оставить отзыв
 */
export const canReview = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking || booking.userId !== req.user.id) {
      return res.json({ canReview: false });
    }

    const alreadyReviewed = await prisma.review.findUnique({ where: { bookingId } });

    res.json({
      canReview: booking.status === 'COMPLETED' && !alreadyReviewed
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка проверки' });
  }
};
