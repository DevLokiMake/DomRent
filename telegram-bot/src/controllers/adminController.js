import { getOpenTickets, replyTicket, closeTicket, getAllSessionIds } from '../services/dbService.js';
import { getSession } from '../services/dbService.js';
import { setState, getState, clearState } from '../state.js';
import { cancelBtn } from '../keyboards/mainKeyboard.js';
import { config } from '../config.js';

const isAdmin = (chatId) => config.ADMIN_IDS.includes(Number(chatId));

// ── /admin — open tickets list ───────────────────────────────────────────────

export const handleAdminTickets = async (bot, msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  const tickets = await getOpenTickets();

  if (!tickets.length) {
    return bot.sendMessage(chatId, 'Открытых обращений нет.');
  }

  await bot.sendMessage(chatId, `Открытые обращения: ${tickets.length}`);

  for (const t of tickets) {
    const who = [
      t.tg_first_name || '—',
      t.tg_username ? `@${t.tg_username}` : null,
    ].filter(Boolean).join(' ');
    const date = new Date(t.created_at).toLocaleString('ru-RU');

    await bot.sendMessage(chatId,
      `#${t.id} | ${who}\n${date}\n\n${t.message}`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: 'Ответить', callback_data: `reply_${t.id}_${t.telegram_id}` },
            { text: 'Закрыть', callback_data: `close_${t.id}` },
          ]],
        },
      }
    );
  }
};

// ── /broadcast ───────────────────────────────────────────────────────────────

export const handleBroadcast = async (bot, msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  setState(chatId, { step: 'broadcast_msg' });
  await bot.sendMessage(chatId,
    'Введите сообщение для рассылки всем пользователям бота:', cancelBtn
  );
};

export const processBroadcast = async (bot, msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  clearState(chatId);

  await bot.sendMessage(chatId, 'Запускаю рассылку...');

  const ids = await getAllSessionIds();
  let sent = 0, failed = 0;

  for (const id of ids) {
    try {
      await bot.sendMessage(id, `Сообщение от DomRent:\n\n${text}`);
      sent++;
      // Telegram rate limit: ~30 messages/sec to different users
      await new Promise(r => setTimeout(r, 40));
    } catch { failed++; }
  }

  await bot.sendMessage(chatId,
    `Рассылка завершена\nОтправлено: ${sent}\nОшибок: ${failed}`
  );
};

// ── Callback: reply to ticket ─────────────────────────────────────────────────

export const startTicketReply = async (bot, callbackQuery, ticketId, userTelegramId) => {
  const chatId = callbackQuery.message.chat.id;
  setState(chatId, { step: 'admin_reply', ticketId, userTelegramId });

  await bot.answerCallbackQuery(callbackQuery.id);
  await bot.sendMessage(chatId,
    `Ответ на обращение #${ticketId}:`, cancelBtn
  );
};

export const processTicketReply = async (bot, msg) => {
  const chatId = msg.chat.id;
  const { ticketId, userTelegramId } = getState(chatId);
  const replyText = msg.text;
  clearState(chatId);

  try {
    await replyTicket(ticketId, replyText, chatId);
    await bot.sendMessage(Number(userTelegramId),
      `Ответ на ваше обращение #${ticketId}:\n\n${replyText}`
    );
    await bot.sendMessage(chatId, `Ответ на #${ticketId} отправлен.`);
  } catch {
    await bot.sendMessage(chatId, 'Ошибка при отправке ответа.');
  }
};

// ── Callback: close ticket ───────────────────────────────────────────────────

export const handleCloseTicket = async (bot, callbackQuery, ticketId) => {
  const chatId = callbackQuery.message.chat.id;
  await closeTicket(ticketId);
  await bot.answerCallbackQuery(callbackQuery.id, { text: `#${ticketId} закрыто` });
  // Remove inline keyboard from the ticket message
  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: chatId, message_id: callbackQuery.message.message_id }
    );
  } catch { /* message may be too old to edit */ }
};
