import { getSession } from '../services/dbService.js';
import { mainMenu, adminMenu } from '../keyboards/mainKeyboard.js';

const ROLE_LABEL = { USER: 'Пользователь', LANDLORD: 'Арендодатель', ADMIN: 'Администратор' };

export const handleStart = async (bot, msg, linkCode) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'Гость';

  if (linkCode) {
    // Delegate to auth — imported lazily to avoid circular deps
    const { processLinkCode } = await import('./authController.js');
    return processLinkCode(bot, msg, linkCode);
  }

  const session = await getSession(chatId);

  if (session?.access_token) {
    const kb = (session.role === 'ADMIN' || session.role === 'LANDLORD') ? adminMenu : mainMenu;
    return bot.sendMessage(chatId,
      `Вы в DomRent, ${session.first_name || firstName}!\nРоль: ${ROLE_LABEL[session.role] || session.role}\n\nВыберите действие:`,
      kb
    );
  }

  await bot.sendMessage(chatId,
    `Добро пожаловать в DomRent!\n\n` +
    `Я помогу вам:\n` +
    `— Отслеживать бронирования\n` +
    `— Получать уведомления\n` +
    `— Просматривать избранное\n` +
    `— Обращаться в поддержку\n\n` +
    `Для начала привяжите аккаунт DomRent:\n\n` +
    `1. Войдите на domrent.kz\n` +
    `2. Откройте Профиль → Настройки\n` +
    `3. Нажмите «Привязать Telegram»\n` +
    `4. Отправьте боту: /link <код>`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Инструкция по привязке', callback_data: 'auth_help' }],
        ],
      },
    }
  );
};
