export const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: 'Мои бронирования' }, { text: 'Избранное' }],
      [{ text: 'Мой профиль' }, { text: 'Поддержка' }],
      [{ text: 'Помощь' }],
    ],
    resize_keyboard: true,
    persistent: true,
  },
};

export const adminMenu = {
  reply_markup: {
    keyboard: [
      [{ text: 'Мои бронирования' }, { text: 'Избранное' }],
      [{ text: 'Мой профиль' }, { text: 'Поддержка' }],
      [{ text: 'Обращения' }, { text: 'Рассылка' }],
      [{ text: 'Помощь' }],
    ],
    resize_keyboard: true,
    persistent: true,
  },
};

export const cancelBtn = {
  reply_markup: {
    inline_keyboard: [[{ text: 'Отмена', callback_data: 'cancel' }]],
  },
};
