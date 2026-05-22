import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Инициализация Telegram бота
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN не указан в переменных окружения. Telegram бот отключен.');
} else {
  try {
    bot = new TelegramBot(token, { polling: true });

    // Обработчик команды /start
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

    // Обработчик всех остальных сообщений (помощь)
    bot.on('message', (msg) => {
      if (msg.text === '/start') return; 

      const chatId = msg.chat.id;
      const helpMessage = `Доступные команды:\n` +
        `/start - Получить ваш Telegram ID\n\n` +
        `Для получения уведомлений:\n` +
        `1. Используйте команду /start\n` +
        `2. Скопируйте ваш ID\n` +
        `3. Введите ID в приложение DomRent`;

      bot.sendMessage(chatId, helpMessage).catch((error) => {
        console.error('Ошибка при отправке help сообщения:', error);
      });
    });

    // Обработчик ошибок polling
    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });

    console.log('Telegram бот инициализирован успешно');
  } catch (error) {
    console.error('Ошибка инициализации Telegram бота:', error);
    bot = null;
  }
}

/**
 * Отправка уведомления о новом бронировании владельцу объекта
 */
export const sendBookingNotification = async (ownerId, bookingDetails) => {
  if (!bot) {
    console.warn('Telegram бот не инициализирован. Уведомление не отправлено.');
    return;
  }

  try {
    // Поиск владельца объекта в БД
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { telegramId: true, name: true, email: true }
    });

    if (!owner) {
      console.warn(`Владелец с ID ${ownerId} не найден`);
      return;
    }

    if (!owner.telegramId) {
      console.info(`У владельца ${owner.email} не установлен Telegram ID`);
      return;
    }

    // Форматирование дат и расчет ночей
    const start = new Date(bookingDetails.startDate);
    const end = new Date(bookingDetails.endDate);
    const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    const startDateStr = start.toLocaleDateString('ru-RU');
    const endDateStr = end.toLocaleDateString('ru-RU');

    // Формирование сообщения
    const message = `📧 <b>Новое бронирование!</b>\n\n` +
      `🏠 <b>Объект:</b> ${bookingDetails.propertyTitle}\n` +
      `📅 <b>Даты:</b> ${startDateStr} - ${endDateStr}\n` +
      `🌙 <b>Ночей:</b> ${daysCount}\n` +
      `💰 <b>Сумма:</b> ${bookingDetails.totalPrice} ₸\n\n` +
      `👤 <b>Гость:</b> ${bookingDetails.guestName || 'Не указано'}\n` +
      `📧 <b>Email:</b> ${bookingDetails.guestEmail}\n` +
      `📱 <b>Телефон:</b> ${bookingDetails.guestPhone || 'Не указано'}`;

    // Отправка сообщения
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
  if (bot) {
    bot.stopPolling();
    console.log('Telegram бот остановлен');
  }
};

export default bot;
