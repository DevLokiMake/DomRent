import { createTicket } from '../services/dbService.js';
import { getSession } from '../services/dbService.js';
import { setState, clearState } from '../state.js';
import { cancelBtn } from '../keyboards/mainKeyboard.js';
import { config } from '../config.js';

export const handleSupport = async (bot, msg) => {
  const chatId = msg.chat.id;
  setState(chatId, { step: 'support_msg' });
  await bot.sendMessage(chatId,
    'Опишите ваш вопрос или проблему. Мы ответим как можно скорее.',
    cancelBtn
  );
};

export const processSupportMsg = async (bot, msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  const session = await getSession(chatId);

  try {
    const ticket = await createTicket({
      telegramId: chatId,
      userId: session?.user_id || null,
      tgUsername: msg.from?.username || null,
      tgFirstName: msg.from?.first_name || null,
      message,
    });

    clearState(chatId);
    await bot.sendMessage(chatId,
      `Обращение #${ticket.id} принято!\nОтветим в течение 24 часов.`
    );

    // Notify admins
    const who = [
      msg.from?.first_name,
      msg.from?.username ? `@${msg.from.username}` : null,
      session?.user_id ? `(user #${session.user_id})` : '(гость)',
    ].filter(Boolean).join(' ');

    for (const adminId of config.ADMIN_IDS) {
      try {
        await bot.sendMessage(adminId,
          `Обращение #${ticket.id}\n\nОт: ${who}\n\n${message}`,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: 'Ответить', callback_data: `reply_${ticket.id}_${chatId}` },
                { text: 'Закрыть', callback_data: `close_${ticket.id}` },
              ]],
            },
          }
        );
      } catch { /* admin hasn't started bot */ }
    }
  } catch {
    clearState(chatId);
    await bot.sendMessage(chatId, 'Ошибка при отправке. Попробуйте позже.');
  }
};
