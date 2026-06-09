import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Регистрация пользователя
 * @param {Object} req - Express request объект (body уже валидирован middleware)
 * @param {Object} res - Express response объект
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, role = 'USER' } = req.body;

    // Проверка на существующий email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role
      }
    });

    // Генерация JWT токена
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
};

/**
 * Вход пользователя
 * @param {Object} req - Express request объект (body уже валидирован middleware)
 * @param {Object} res - Express response объект
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя по email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Неверные учетные данные' });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверные учетные данные' });
    }

    // Генерация JWT токена
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Успешный вход',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
};

/**
 * GET /api/auth/me
 * Получить профиль текущего пользователя
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, phone: true,
        avatar: true, role: true, isBanned: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
};

/**
 * PATCH /api/auth/me
 * Обновить профиль: name, phone, avatar
 */
export const updateMe = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const data = {};
    if (name !== undefined) data.name = name?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (avatar !== undefined) data.avatar = avatar?.trim() || null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, email: true, name: true, phone: true,
        avatar: true, role: true, isBanned: true, createdAt: true,
      },
    });

    res.json({ message: 'Профиль обновлён', user });
  } catch (error) {
    console.error('updateMe error:', error);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
};

