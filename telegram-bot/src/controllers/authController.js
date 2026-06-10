import { verifyLinkCode } from '../services/apiService.js';
import { saveSession, deleteSession, getSession } from '../services/dbService.js';
import { setState, clearState } from '../state.js';
import { mainMenu, adminMenu, cancelBtn } from '../keyboards/mainKeyboard.js';

const ROLE_LABEL = { USER: 'Пользователь', LANDLORD: 'Арендодатель', ADMIN: 'Администратор' };

export const handleLink = async (bot, msg, codeArg) => {
  const chatId = msg.chat.id;

  if (codeArg) {
    return processLinkCode(bot, msg, codeArg);
  }

  setState(chatId, { step: 'await_link_code' });
  await bot.sendMessage(chatId,
    'Введите код привязки из личного кабинета DomRent:',
    cancelBtn
  );
};

export const processLinkCode = async (bot, msg, code) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId, 'Проверяю код...');

  try {
    const data = await verifyLinkCode(code.trim(), chatId);
    // data = { token, userId, name, role }

    await saveSession({
      telegramId: chatId,
      userId: data.userId,
      accessToken: data.token,
      firstName: msg.from?.first_name || null,
      username: msg.from?.username || null,
      role: data.role || 'USER',
    });

    clearState(chatId);

    const kb = (data.role === 'ADMIN' || data.role === 'LANDLORD') ? adminMenu : mainMenu;
    await bot.sendMessage(chatId,
      `Аккаунт привязан!\n\nИмя: ${data.name || '—'}\nРоль: ${ROLE_LABEL[data.role] || data.role}`,
      kb
    );
  } catch (err) {
    clearState(chatId);
    const detail = err.response?.data?.error || err.message;
    await bot.sendMessage(chatId,
      `Не удалось привязать аккаунт: ${detail}\n\nПолучите новый код в личном кабинете.`
    );
  }
};

export const handleUnlink = async (bot, msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);

  if (!session?.user_id) {
    return bot.sendMessage(chatId, 'Аккаунт не привязан.');
  }

  await deleteSession(chatId);
  await bot.sendMessage(chatId,
    'Аккаунт отвязан. Для работы с ботом привяжите его снова через /link.',
    { reply_markup: { remove_keyboard: true } }
  );
};
