// In-memory conversation state manager (per chat session)
const state = new Map();

export const setState = (chatId, data) =>
  state.set(String(chatId), { ...(state.get(String(chatId)) || {}), ...data });

export const getState = (chatId) =>
  state.get(String(chatId)) || {};

export const clearState = (chatId) =>
  state.delete(String(chatId));
