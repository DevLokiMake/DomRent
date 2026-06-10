import { fetchProfile } from '../services/apiService.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const ROLE_LABEL = { USER: 'Пользователь', LANDLORD: 'Арендодатель', ADMIN: 'Администратор' };

export const handleProfile = async (bot, msg) => {
  const chatId = msg.chat.id;

  await requireAuth(bot, chatId, async (session) => {
    try {
      const user = await fetchProfile(chatId);

      const lines = [
        `Профиль DomRent`,
        ``,
        `Имя: ${user.name || '—'}`,
        `Email: ${user.email}`,
        `Роль: ${ROLE_LABEL[user.role] || user.role}`,
        user.phone ? `Телефон: ${user.phone}` : null,
        ``,
        `Бронирований: ${user._count?.bookings ?? '—'}`,
        user._count?.properties != null
          ? `Объявлений: ${user._count.properties}` : null,
        ``,
        `Telegram: привязан`,
      ].filter(line => line !== null);

      await bot.sendMessage(chatId, lines.join('\n'), {
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть профиль', url: 'https://domrent.kz/profile' }]],
        },
      });
    } catch (err) {
      const text = err.code === 'NOT_AUTHENTICATED'
        ? 'Необходима авторизация. Используйте /link для привязки аккаунта.'
        : 'Ошибка загрузки профиля. Попробуйте позже.';
      await bot.sendMessage(chatId, text);
    }
  });
};
