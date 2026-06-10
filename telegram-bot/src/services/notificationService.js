const fmt = (d) => new Date(d).toLocaleDateString('ru-RU');
const money = (n) => Number(n || 0).toLocaleString('ru-RU');

export const buildNotification = (type, data = {}) => {
  const { propertyTitle, startDate, endDate, totalPrice, guestName, guestEmail, status, reason, rating, reviewText } = data;

  switch (type) {
    case 'BOOKING_NEW':
      return `Новое бронирование!\n\nОбъект: ${propertyTitle}\nГость: ${guestName || '—'} (${guestEmail || '—'})\nДаты: ${fmt(startDate)} — ${fmt(endDate)}\nСумма: ${money(totalPrice)} ₸`;

    case 'BOOKING_CONFIRMED':
      return `Бронирование подтверждено!\n\nОбъект: ${propertyTitle}\nДаты: ${fmt(startDate)} — ${fmt(endDate)}\nСумма: ${money(totalPrice)} ₸`;

    case 'BOOKING_CANCELLED':
      return `Бронирование отменено\n\nОбъект: ${propertyTitle}\nДаты: ${fmt(startDate)} — ${fmt(endDate)}`;

    case 'BOOKING_STATUS':
      return `Статус бронирования изменён\n\nОбъект: ${propertyTitle}\nНовый статус: ${status}`;

    case 'PROPERTY_APPROVED':
      return `Объявление одобрено!\n\nОбъект: ${propertyTitle}\nТеперь оно видно в поиске.`;

    case 'PROPERTY_REJECTED':
      return `Объявление отклонено\n\nОбъект: ${propertyTitle}\nПричина: ${reason || 'не указана'}`;

    case 'REVIEW_NEW':
      return `Новый отзыв\n\nОбъект: ${propertyTitle}\nОценка: ${'★'.repeat(rating || 0)}${'☆'.repeat(5 - (rating || 0))} (${rating}/5)\n${reviewText || ''}`;

    default:
      return data.message || `Уведомление от DomRent`;
  }
};
