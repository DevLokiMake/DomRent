import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Создание нового объекта недвижимости (только для LANDLORD)
 * @param {Object} req - Express request объект (body уже валидирован middleware)
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

    const { title, description, price, type, contractType, city, images, latitude, longitude } = req.body;

    // Логика: если города нет, создать его
    let cityRecord = await prisma.city.findUnique({
      where: { name: city }
    });

    if (!cityRecord) {
      cityRecord = await prisma.city.create({
        data: { name: city }
      });
    }

    // Создание объекта
    const property = await prisma.property.create({
      data: {
        title,
        description,
        price,
        type,
        contractType,
        cityId: cityRecord.id,
        images,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
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
        },
        city: true
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
    const { cityId, city, minPrice, maxPrice, type, contractType } = req.query;

    // Построение условий фильтрации
    const where = {};

    // Фильтрация по городу (по имени или ID)
    if (cityId) {
      where.cityId = parseInt(cityId);
    } else if (city) {
      // Найдём city ID по названию
      const cityRecord = await prisma.city.findUnique({
        where: { name: city }
      });
      if (cityRecord) {
        where.cityId = cityRecord.id;
      } else {
        // Если города нет, вернём пустой результат
        return res.json({
          count: 0,
          properties: []
        });
      }
    }

    if (type) {
      where.type = type;
    }

    if (contractType) {
      where.contractType = contractType;
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
        city: true,
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
        city: true,
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

    // Если есть город в запросе, обработаем его
    let updateData = { ...parsed.data };
    if (parsed.data.city) {
      let cityRecord = await prisma.city.findUnique({
        where: { name: parsed.data.city }
      });

      if (!cityRecord) {
        cityRecord = await prisma.city.create({
          data: { name: parsed.data.city }
        });
      }

      updateData.cityId = cityRecord.id;
      delete updateData.city; // Удалим город из обновления, так как используем cityId
    }

    // Обновление объекта
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        city: true
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

/**
 * Формула Haversine — расстояние между двумя точками на сфере (км)
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * GET /api/properties/nearby?lat=...&lng=...&radius=10
 * Возвращает объекты в радиусе (км) от точки, отсортированные по расстоянию
 */
export const getNearbyProperties = async (req, res) => {
  try {
    const { lat, lng, radius = '10' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Параметры lat и lng обязательны' });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if ([centerLat, centerLng, radiusKm].some(isNaN)) {
      return res.status(400).json({ error: 'Некорректные числовые параметры' });
    }

    const allProperties = await prisma.property.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        owner: { select: { id: true, email: true, name: true, phone: true } },
        city: true,
        _count: { select: { bookings: true, favorites: true } }
      }
    });

    const nearby = allProperties
      .map(p => ({
        ...p,
        distance: Math.round(haversineKm(centerLat, centerLng, p.latitude, p.longitude) * 10) / 10
      }))
      .filter(p => p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({ count: nearby.length, properties: nearby });
  } catch (error) {
    console.error('Get nearby properties error:', error);
    res.status(500).json({ error: 'Ошибка при поиске объектов рядом' });
  }
};
