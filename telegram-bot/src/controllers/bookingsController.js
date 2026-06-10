import { fetchBookings } from '../services/apiService.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const STATUS_ICON = { UPCOMING: 'o', ACTIVE: '+', COMPLETED: 'v', CANCELLED: 'x' };
const STATUS_LABEL = {
  UPCOMING: 'Предстоящее',
  ACTIVE: 'Активное',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
};

export const handleMyBookings = async (bot, msg) => {
  const chatId = msg.chat.id;

  await requireAuth(bot, chatId, async () => {
    try {
      const bookings = await fetchBookings(chatId);

      if (!bookings.length) {
        return bot.sendMessage(chatId, 'Бронирований пока нет.', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Найти жильё', url: 'https://domrent.kz' }]],
          },
        });
      }

      // Active/upcoming first
      const sorted = [
        ...bookings.filter(b => ['UPCOMING', 'ACTIVE'].includes(b.status)),
        ...bookings.filter(b => !['UPCOMING', 'ACTIVE'].includes(b.status)),
      ];

      const toDate = (d) => new Date(d).toLocaleDateString('ru-RU');

      let text = `Ваши бронирования (${bookings.length}):\n\n`;

      for (const b of sorted.slice(0, 10)) {
        const city = typeof b.property?.city === 'object'
          ? b.property.city?.name : b.property?.city || '';
        const icon = STATUS_ICON[b.status] || '-';
        const label = STATUS_LABEL[b.status] || b.status;

        text += `[${icon}] ${b.property?.title || 'Объект'}\n`;
        text += `    ${city ? city + ', ' : ''}${toDate(b.startDate)} — ${toDate(b.endDate)}\n`;
        text += `    ${label} | ${Number(b.totalPrice || 0).toLocaleString('ru-RU')} ₸\n\n`;
      }

      if (bookings.length > 10) text += `... и ещё ${bookings.length - 10} на сайте`;

      await bot.sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть все', url: 'https://domrent.kz/bookings' }]],
        },
      });
    } catch (err) {
      const text = err.code === 'NOT_AUTHENTICATED'
        ? 'Необходима авторизация.'
        : 'Ошибка загрузки бронирований. Попробуйте позже.';
      await bot.sendMessage(chatId, text);
    }
  });
};
