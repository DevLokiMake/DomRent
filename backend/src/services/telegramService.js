import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Инициализация Telegram бота
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN не указан в переменных окружения');
}

const bot = new TelegramBot(token, { polling: true });

/**
 * Обработчик команды /start
 * Отправляет приветствие и chatId пользователю
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const greeting = `🏠 Добро пожаловать в DomRent!\n\n` +
    `Ваш Telegram ID: <code>${chatId}</code>\n\n` +
    `Скопируйте этот ID и введите его в приложении DomRent для получения уведомлений о новых бронированиях.\n\n` +
    `После этого вы будете получать все уведомления о бронированиях прямо в Telegram!`;

  bot.sendMessage(chatId, greeting, {
    parse_mode: 'HTML'
  }).catch((error) => {
    console.error('Ошибка при отправке /start сообщения:', error);
  });
});

/**
 * Обработчик всех остальных сообщений
 * Информирует пользователя о доступных командах
 */
bot.on('message', (msg) => {
  if (msg.text === '/start') return; // Пропускаем, обработано выше
  
  const chatId = msg.chat.id;
  const helpMessage = `Доступные команды:\n` +
    `/start - Получить ваш Telegram ID\n\n` +
    `Для получения уведомлений:\n` +
    `1. Используйте команду /start\n` +
    `2. Скопируйте ваш ID\n` +
    `3. Введите ID в приложение DomRent`;

  bot.sendMessage(chatId, helpMessage).catch((error) => {
    console.error('Ошибка при отправке сообщения:', error);
  });
});

/**
 * Обработчик ошибок polling
 */
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

/**
 * Отправка уведомления о новом бронировании владельцу объекта
 * @param {number} ownerId - ID владельца объекта
 * @param {Object} bookingDetails - Детали бронирования
 * @param {string} bookingDetails.propertyTitle - Название объекта
 * @param {Date} bookingDetails.startDate - Начало бронирования
 * @param {Date} bookingDetails.endDate - Конец бронирования
 * @param {number} bookingDetails.totalPrice - Общая стоимость
 * @param {string} bookingDetails.guestName - Имя гостя
 * @param {string} bookingDetails.guestEmail - Email гостя
 * @param {string} bookingDetails.guestPhone - Телефон гостя
 */
export const sendBookingNotification = async (ownerId, bookingDetails) => {
  try {
    // Поиск владельца объекта в БД
    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    // Если владелец не найден, выходим
    if (!owner) {
      console.warn(`Владелец с ID ${ownerId} не найден`);
      return;
    }

    // Если у владельца нет telegramId, не отправляем уведомление
    if (!owner.telegramId) {
      console.info(`У владельца ${owner.email} не установлен Telegram ID`);
      return;
    }

    // Форматирование дат
    const startDate = new Date(bookingDetails.startDate).toLocaleDateString('ru-RU');
    const endDate = new Date(bookingDetails.endDate).toLocaleDateString('ru-RU');

    // Расчет количества дней
    const start = new Date(bookingDetails.startDate);
    const end = new Date(bookingDetails.endDate);
    const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Формирование сообщения
    const message = `📧 <b>Новое бронирование!</b>\n\n` +
      `🏠 <b>Объект:</b> ${bookingDetails.propertyTitle}\n` +
      `📅 <b>Даты:</b> ${startDate} - ${endDate}\n` +
      `🌙 <b>Ночей:</b> ${daysCount}\n` +
      `💰 <b>Сумма:</b> ${bookingDetails.totalPrice} ₸\n\n` +
      `👤 <b>Гость:</b> ${bookingDetails.guestName || 'Не указано'}\n` +
      `📧 <b>Email:</b> ${bookingDetails.guestEmail}\n` +
      `📱 <b>Телефон:</b> ${bookingDetails.guestPhone || 'Не указано'}`;

    // Отправка сообщения через бота
    await bot.sendMessage(owner.telegramId, message, {
      parse_mode: 'HTML'
    });

    console.log(`Уведомление отправлено владельцу ${owner.email} (${owner.telegramId})`);
  } catch (error) {
    console.error('Ошибка при отправке уведомления о бронировании:', error);
  }
};

/**
 * Остановка бота (для graceful shutdown)
 */
export const stopBot = () => {
  bot.stopPolling();
};

export default bot;