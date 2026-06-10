import { config } from '../config.js';

export const handleHelp = async (bot, msg) => {
  const chatId = msg.chat.id;
  const isAdmin = config.ADMIN_IDS.includes(Number(chatId));

  const lines = [
    'Команды DomRent:',
    '',
    '/start — Главное меню',
    '/link <код> — Привязать аккаунт DomRent',
    '/unlink — Отвязать аккаунт',
    '/profile — Мой профиль',
    '/mybookings — Мои бронирования',
    '/favorites — Избранные объекты',
    '/support — Написать в поддержку',
    '/help — Этот список',
  ];

  if (isAdmin) {
    lines.push('', 'Администратор:', '/admin — Открытые обращения', '/broadcast — Рассылка всем');
  }

  lines.push('', 'Сайт: https://domrent.kz');

  await bot.sendMessage(chatId, lines.join('\n'));
};
