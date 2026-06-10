import { getSession } from '../services/dbService.js';

export const requireAuth = async (bot, chatId, handler) => {
  const session = await getSession(chatId);
  if (!session?.access_token) {
    await bot.sendMessage(chatId,
      'Для этого нужно привязать аккаунт DomRent.\n\n' +
      '1. Войдите на domrent.kz\n' +
      '2. Профиль → Настройки → «Привязать Telegram»\n' +
      '3. Отправьте боту: /link <код>',
      {
        reply_markup: {
          inline_keyboard: [[{ text: 'Как привязать?', callback_data: 'auth_help' }]],
        },
      }
    );
    return;
  }
  await handler(session);
};
