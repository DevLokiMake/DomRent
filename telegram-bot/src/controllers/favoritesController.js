import { fetchFavorites } from '../services/apiService.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export const handleFavorites = async (bot, msg) => {
  const chatId = msg.chat.id;

  await requireAuth(bot, chatId, async () => {
    try {
      const favs = await fetchFavorites(chatId);

      if (!favs.length) {
        return bot.sendMessage(chatId, 'Список избранного пуст.\n\nДобавляйте объекты на сайте.', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Перейти на сайт', url: 'https://domrent.kz' }]],
          },
        });
      }

      let text = `Избранные объекты (${favs.length}):\n\n`;

      for (const fav of favs.slice(0, 8)) {
        const p = fav.property || fav;
        const city = typeof p.city === 'object' ? p.city?.name : p.city || '';
        const price = p.contractType === 'RENT'
          ? `${Number(p.price || 0).toLocaleString('ru-RU')} ₸/ночь`
          : `${Number(p.price || 0).toLocaleString('ru-RU')} ₸`;

        text += `♥ ${p.title || 'Объект'}\n`;
        text += `  ${city ? city + ' | ' : ''}${price}\n\n`;
      }

      if (favs.length > 8) text += `... и ещё ${favs.length - 8}`;

      await bot.sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть избранное', url: 'https://domrent.kz/favorites' }]],
        },
      });
    } catch (err) {
      const text = err.code === 'NOT_AUTHENTICATED'
        ? 'Необходима авторизация.'
        : 'Ошибка загрузки избранного.';
      await bot.sendMessage(chatId, text);
    }
  });
};
