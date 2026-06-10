import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.DB_URL });

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_sessions (
      telegram_id  BIGINT PRIMARY KEY,
      user_id      INTEGER,
      access_token TEXT NOT NULL,
      first_name   VARCHAR(255),
      username     VARCHAR(255),
      role         VARCHAR(50) DEFAULT 'USER',
      created_at   TIMESTAMP DEFAULT NOW(),
      updated_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bot_support_tickets (
      id              SERIAL PRIMARY KEY,
      telegram_id     BIGINT NOT NULL,
      user_id         INTEGER,
      tg_username     VARCHAR(255),
      tg_first_name   VARCHAR(255),
      message         TEXT NOT NULL,
      status          VARCHAR(20) DEFAULT 'open'
                        CHECK (status IN ('open', 'answered', 'closed')),
      reply           TEXT,
      admin_telegram_id BIGINT,
      created_at      TIMESTAMP DEFAULT NOW(),
      updated_at      TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('[DB] Tables ready');
};
