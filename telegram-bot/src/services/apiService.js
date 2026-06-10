import axios from 'axios';
import { config } from '../config.js';
import { getSession } from './dbService.js';

const http = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
});

const withAuth = async (telegramId, method, path, data) => {
  const session = await getSession(telegramId);
  if (!session?.access_token) {
    const err = new Error('NOT_AUTHENTICATED');
    err.code = 'NOT_AUTHENTICATED';
    throw err;
  }
  return http.request({
    method,
    url: path,
    data,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
};

// ── Auth / linking ──────────────────────────────────────────────────────────

export const verifyLinkCode = async (code, telegramId) => {
  const res = await http.post('/telegram/link', {
    code,
    telegramId: String(telegramId),
  });
  return res.data; // { token, userId, name, role }
};

// ── User ────────────────────────────────────────────────────────────────────

export const fetchProfile = async (telegramId) => {
  const res = await withAuth(telegramId, 'get', '/telegram/profile');
  return res.data.user;
};

// ── Bookings ────────────────────────────────────────────────────────────────

export const fetchBookings = async (telegramId) => {
  const res = await withAuth(telegramId, 'get', '/bookings/my');
  return res.data.bookings || res.data || [];
};

// ── Favorites ───────────────────────────────────────────────────────────────

export const fetchFavorites = async (telegramId) => {
  const res = await withAuth(telegramId, 'get', '/favorites');
  return res.data.favorites || res.data || [];
};
