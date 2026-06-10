import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';
import { initDB } from './db.js';
import { getState, clearState } from './state.js';
import { startNotifyServer } from './server.js';

import { handleStart } from './controllers/startController.js';
import { handleLink, processLinkCode, handleUnlink } from './controllers/authController.js';
import { handleProfile } from './controllers/profileController.js';
import { handleMyBookings } from './controllers/bookingsController.js';
import { handleFavorites } from './controllers/favoritesController.js';
import { handleSupport, processSupportMsg } from './controllers/supportController.js';
import {
  handleAdminTickets, handleBroadcast, processBroadcast,
  startTicketReply, processTicketReply, handleCloseTicket,
} from './controllers/adminController.js';
import { handleHelp } from './controllers/helpController.js';

if (!config.BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

// ── Init ────────────────────────────────────────────────────────────────────

await initDB();

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
startNotifyServer(bot);
console.log('[Bot] DomRent bot started');

// ── Command-to-text keyboard map ────────────────────────────────────────────

const MENU_MAP = {
  'Мои бронирования': (m) => handleMyBookings(bot, m),
  'Избранное':        (m) => handleFavorites(bot, m),
  'Мой профиль':      (m) => handleProfile(bot, m),
  'Поддержка':        (m) => handleSupport(bot, m),
  'Помощь':           (m) => handleHelp(bot, m),
  'Обращения':        (m) => handleAdminTickets(bot, m),
  'Рассылка':         (m) => handleBroadcast(bot, m),
};

// ── Commands ─────────────────────────────────────────────────────────────────

bot.onText(/\/start(?:\s+(.+))?$/, (msg, match) =>
  handleStart(bot, msg, match[1]?.trim() || null)
);

bot.onText(/\/link(?:\s+(.+))?$/, (msg, match) =>
  match[1] ? processLinkCode(bot, msg, match[1].trim()) : handleLink(bot, msg, null)
);

bot.onText(/\/unlink$/,     (msg) => handleUnlink(bot, msg));
bot.onText(/\/profile$/,    (msg) => handleProfile(bot, msg));
bot.onText(/\/mybookings$/, (msg) => handleMyBookings(bot, msg));
bot.onText(/\/favorites$/,  (msg) => handleFavorites(bot, msg));
bot.onText(/\/support$/,    (msg) => handleSupport(bot, msg));
bot.onText(/\/admin$/,      (msg) => handleAdminTickets(bot, msg));
bot.onText(/\/broadcast$/,  (msg) => handleBroadcast(bot, msg));
bot.onText(/\/help$/,       (msg) => handleHelp(bot, msg));

// ── Message router ────────────────────────────────────────────────────────────

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  // Reply keyboard buttons
  if (MENU_MAP[text]) return MENU_MAP[text](msg);

  // State-based handlers
  const { step } = getState(chatId);

  if (step === 'await_link_code') {
    clearState(chatId);
    return processLinkCode(bot, msg, text.trim());
  }

  if (step === 'support_msg') return processSupportMsg(bot, msg);
  if (step === 'broadcast_msg') return processBroadcast(bot, msg);
  if (step === 'admin_reply') return processTicketReply(bot, msg);
});

// ── Callback queries ──────────────────────────────────────────────────────────

bot.on('callback_query', async (cq) => {
  const data = cq.data;
  const chatId = cq.message.chat.id;

  if (data === 'cancel') {
    clearState(chatId);
    await bot.answerCallbackQuery(cq.id);
    return bot.sendMessage(chatId, 'Отменено.');
  }

  if (data === 'auth_help') {
    await bot.answerCallbackQuery(cq.id);
    return bot.sendMessage(chatId,
      '1. Войдите на domrent.kz\n' +
      '2. Профиль → Настройки → «Привязать Telegram»\n' +
      '3. Отправьте боту: /link <код>'
    );
  }

  // reply_<ticketId>_<userChatId>
  if (data.startsWith('reply_')) {
    const [, ticketId, userChatId] = data.split('_');
    return startTicketReply(bot, cq, parseInt(ticketId), userChatId);
  }

  // close_<ticketId>
  if (data.startsWith('close_')) {
    return handleCloseTicket(bot, cq, parseInt(data.split('_')[1]));
  }

  await bot.answerCallbackQuery(cq.id);
});

// ── Error handling ────────────────────────────────────────────────────────────

bot.on('polling_error', (err) =>
  console.error('[Bot] Polling error:', err.code || err.message)
);
