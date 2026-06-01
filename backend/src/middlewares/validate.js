import { z } from 'zod';

/**
 * Schemas для валидации данных
 */

// Регистрация пользователя
export const registerSchema = z.object({
  email: z.string().email('Email должен быть валидным'),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
  name: z.string().min(1, 'Имя обязательно').optional(),
  phone: z.string().optional(),
  role: z.enum(['USER', 'LANDLORD']).optional()
});

// Вход пользователя
export const loginSchema = z.object({
  email: z.string().email('Email должен быть валидным'),
  password: z.string().min(1, 'Пароль обязателен')
});

// Создание объекта недвижимости
export const propertySchema = z.object({
  title: z.string().min(1, 'Название объекта обязательно'),
  description: z.string().min(1, 'Описание обязательно'),
  price: z.number().positive('Цена должна быть положительной'),
  type: z.enum(['квартира', 'дом', 'комната'], { 
    errorMap: () => ({ message: 'Тип должен быть: квартира, дом или комната' }) 
  }),
  contractType: z.enum(['RENT', 'SALE'], {
    errorMap: () => ({ message: 'Тип сделки должен быть RENT (Аренда) или SALE (Продажа)' })
  }),
  city: z.string().min(1, 'Город обязателен'),
  images: z.array(z.string().url('Некорректный URL изображения')).optional().default([])
});

// Обновление объекта недвижимости
export const updatePropertySchema = propertySchema.partial();

// Бронирование (with future date validation)
export const bookingSchema = z.object({
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
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const now = new Date();
    // Даты не должны быть в прошлом (позволяем текущий день)
    return start >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },
  { message: 'Дата начала не может быть в прошлом' }
);

// Обновление профиля
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Имя не может быть пустым').optional(),
  phone: z.string().optional()
});

/**
 * Middleware фабрика для валидации запроса
 * @param {ZodSchema} schema - Zod schema для валидации
 * @returns {Function} Express middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      
      if (!parsed.success) {
        const errors = parsed.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Ошибка валидации',
          details: errors
        });
      }

      // Заменяем body на валидированные данные
      req.body = parsed.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  };
};

/**
 * Middleware для валидации query параметров
 * @param {ZodSchema} schema - Zod schema для валидации
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.query);
      
      if (!parsed.success) {
        const errors = parsed.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Ошибка валидации параметров',
          details: errors
        });
      }

      // Заменяем query на валидированные данные
      req.query = parsed.data;
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  };
};

export default validate;
