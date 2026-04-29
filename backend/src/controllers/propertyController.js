import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const propertySchema = z.object({
  title: z.string().min(1, 'Название объекта обязательно'),
  description: z.string().min(1, 'Описание обязательно'),
  price: z.number().positive('Цена должна быть положительной'),
  type: z.enum(['квартира', 'дом', 'комната'], { 
    errorMap: () => ({ message: 'Тип должен быть: квартира, дом или комната' }) 
  }),
  city: z.string().min(1, 'Город обязателен'),
  images: z.array(z.string().url('Некорректный URL изображения')).optional().default([])
});

/**
 * Создание нового объекта недвижимости (только для LANDLORD)
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const createProperty = async (req, res) => {
  try {
    // Проверка роли пользователя
    if (req.user.role !== 'LANDLORD') {
      return res.status(403).json({ 
        error: 'Только арендодатели могут добавлять объекты' 
      });
    }

    // Валидация данных
    const parsed = propertySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: parsed.error.errors[0].message 
      });
    }

    const { title, description, price, type, city, images } = parsed.data;

    // Создание объекта
    const property = await prisma.property.create({
      data: {
        title,
        description,
        price,
        type,
        city,
        images,
        ownerId: req.user.id
      },
      include: {
        owner: {
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
      message: 'Объект успешно создан',
      property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Ошибка при создании объекта' });
  }
};

/**
 * Получение всех объектов с поддержкой фильтрации
 * Query параметры: city, minPrice, maxPrice, type
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const getAllProperties = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, type } = req.query;

    // Построение условий фильтрации
    const where = {};

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive' // Поиск без учета регистра
      };
    }

    if (type) {
      where.type = type;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Получение объектов
    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            bookings: true,
            favorites: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({ error: 'Ошибка при получении объектов' });
  }
};

/**
 * Получение объекта по ID
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Валидация ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID объекта' });
    }

    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        bookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            userId: true
          }
        },
        favorites: {
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            bookings: true,
            favorites: true
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Объект не найден' });
    }

    res.json({ property });
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({ error: 'Ошибка при получении объекта' });
  }
};

/**
 * Удаление объекта (только владелец)
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Валидация ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID объекта' });
    }

    const propertyId = parseInt(id);

    // Проверка существования объекта
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Объект не найден' });
    }

    // Проверка прав владельца
    if (property.ownerId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Вы можете удалить только собственные объекты' 
      });
    }

    // Удаление связанных данных (бронирования и избранное)
    await prisma.booking.deleteMany({
      where: { propertyId }
    });

    await prisma.favorite.deleteMany({
      where: { propertyId }
    });

    // Удаление объекта
    await prisma.property.delete({
      where: { id: propertyId }
    });

    res.json({ message: 'Объект успешно удален' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Ошибка при удалении объекта' });
  }
};

/**
 * Обновление объекта (только владелец)
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 */
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Валидация ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID объекта' });
    }

    const propertyId = parseInt(id);

    // Валидация данных
    const updateSchema = propertySchema.partial();
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: parsed.error.errors[0].message 
      });
    }

    // Проверка существования объекта
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Объект не найден' });
    }

    // Проверка прав владельца
    if (property.ownerId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Вы можете редактировать только собственные объекты' 
      });
    }

    // Обновление объекта
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: parsed.data,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: 'Объект успешно обновлен',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении объекта' });
  }
};
