import express from 'express';
import { config } from './config.js';
import { buildNotification } from './services/notificationService.js';

export const startNotifyServer = (bot) => {
  const app = express();
  app.use(express.json());

  // Simple API key auth
  app.use((req, res, next) => {
    const key = req.headers['x-bot-api-key'];
    if (key !== config.BOT_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  // Health check (no auth)
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Single notification: POST /notify { telegramId, type, data } or { telegramId, message }
  app.post('/notify', async (req, res) => {
    const { telegramId, type, data, message } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const text = message || buildNotification(type, data || {});

    try {
      await bot.sendMessage(telegramId, text);
      res.json({ ok: true });
    } catch (err) {
      console.error('[notify] failed:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Bulk notification: POST /notify/bulk { telegramIds: [], message }
  app.post('/notify/bulk', async (req, res) => {
    const { telegramIds, message } = req.body;
    if (!Array.isArray(telegramIds) || !message) {
      return res.status(400).json({ error: 'telegramIds[] and message required' });
    }

    let sent = 0, failed = 0;
    for (const id of telegramIds) {
      try {
        await bot.sendMessage(id, message);
        sent++;
        await new Promise(r => setTimeout(r, 40));
      } catch { failed++; }
    }

    res.json({ sent, failed });
  });

  app.listen(config.PORT, () =>
    console.log(`[Server] Notification server on port ${config.PORT}`)
  );
};
