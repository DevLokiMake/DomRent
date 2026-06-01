# 🔧 Краткая справка: Исправления для совместимости эндпоинтов

## 🎯 Что нужно исправить

| Файл | Проблема | Тип | Приоритет |
|------|---------|------|-----------|
| `hooks/usePropertyDetails.ts` | Формат даты для бронирования | 🔴 Баг | ВЫСОКИЙ |
| `hooks/usePropertyDetails.ts` | Проверка ответа от API | 🟡 Best Practice | СРЕДНИЙ |

---

## 🚨 ИСПРАВЛЕНИЕ 1: Формат даты (ОБЯЗАТЕЛЬНО)

### Текущий код (НЕПРАВИЛЬНЫЙ ❌)

**Файл:** `hooks/usePropertyDetails.ts`, строка 113-115

```typescript
const bookingData = {
  propertyId: property.id,
  startDate,  // ❌ "2024-06-01"
  endDate,    // ❌ "2024-06-05"
};
```

### Исправленный код (ПРАВИЛЬНЫЙ ✅)

```typescript
const bookingData = {
  propertyId: property.id,
  startDate: new Date(startDate).toISOString(),  // ✅ "2024-06-01T00:00:00.000Z"
  endDate: new Date(endDate).toISOString(),      // ✅ "2024-06-05T00:00:00.000Z"
};
```

### Почему это важно

**Backend ожидает:**
```javascript
startDate: z.string().datetime('Формат должен быть ISO 8601')
// Примеры:
// ✅ "2024-06-01T00:00:00.000Z"
// ✅ "2024-06-01T00:00:00+00:00"
// ❌ "2024-06-01" (будет отклонено валидацией)
```

**Текущая отправка:**
```typescript
startDate: "2024-06-01"  // ❌ Не соответствует ISO 8601
```

**Результат:**
- 🔴 Запрос отклонится с ошибкой 400 (валидация)
- 🔴 Бронирование не будет создано

---

## 🟡 ИСПРАВЛЕНИЕ 2: Проверка ответа (РЕКОМЕНДУЕТСЯ)

### Текущий код

**Файл:** `hooks/usePropertyDetails.ts`, строка 120-134

```typescript
await axiosInstance.post('/bookings', bookingData);

Alert.alert('Успех', 'Бронирование создано! Ожидайте подтверждения владельца.', [
  {
    text: 'OK',
    onPress: () => router.back(),
  },
]);
```

### Улучшенный код

```typescript
const response = await axiosInstance.post('/bookings', bookingData);

// Проверка успешного создания
if (!response.data?.booking?.id) {
  throw new Error('Неверный формат ответа от сервера');
}

Alert.alert('Успех', 'Бронирование создано! Ожидайте подтверждения владельца.', [
  {
    text: 'OK',
    onPress: () => router.back(),
  },
]);
```

### Что это даст

- ✅ Проверка, что сервер действительно создал бронирование
- ✅ Более информативные ошибки в логах
- ✅ Защита от неправильных ответов сервера

---

## ✅ ПРОВЕРКА: Эндпоинты без проблем

| Эндпоинт | Frontend | Backend | Статус |
|----------|----------|---------|--------|
| GET /properties/:id | ✅ | `/api/properties/:id` | ✅ Идеально |
| GET /favorites/check/:id | ✅ | `/api/favorites/check/:id` | ✅ Идеально |
| POST /favorites/toggle/:id | ✅ | `/api/favorites/toggle/:id` | ✅ Идеально |

---

## 📝 Примеры форматов дат

### ❌ НЕПРАВИЛЬНО (текущий формат)
```javascript
"2024-06-01"        // ❌ Backend отклонит
"2024-06-05"        // ❌ Backend отклонит
```

### ✅ ПРАВИЛЬНО (после исправления)
```javascript
"2024-06-01T00:00:00.000Z"   // ✅ Backend примет
"2024-06-05T00:00:00.000Z"   // ✅ Backend примет
```

### Как преобразовать

```typescript
// Способ 1: Использовать toISOString()
const date = new Date("2024-06-01");
console.log(date.toISOString());  // "2024-06-01T00:00:00.000Z" ✅

// Способ 2: Добавить T00:00:00Z вручную
const dateStr = "2024-06-01";
console.log(dateStr + "T00:00:00Z");  // "2024-06-01T00:00:00Z" ✅
```

---

## 🔍 Как проверить исправления

### Тест 1: Проверка формата даты

```typescript
// Перед исправлением
const bookingData = {
  propertyId: 1,
  startDate: "2024-06-01",
  endDate: "2024-06-05"
};
console.log(bookingData.startDate);  // "2024-06-01" ❌

// После исправления
const bookingData = {
  propertyId: 1,
  startDate: new Date("2024-06-01").toISOString(),
  endDate: new Date("2024-06-05").toISOString()
};
console.log(bookingData.startDate);  // "2024-06-01T00:00:00.000Z" ✅
```

### Тест 2: Проверка на эмуляторе

1. Откройте приложение на эмуляторе
2. Перейдите на экран деталей объекта
3. Выберите даты бронирования
4. Нажмите "Забронировать"
5. **Проверьте результат:**
   - ❌ Ошибка валидации = нужно исправить формат даты
   - ✅ "Бронирование создано!" = исправление успешно

---

## 📊 Статус эндпоинтов

```
✅ GET /properties/:id              - СОВПАДАЕТ
✅ GET /favorites/check/:id         - СОВПАДАЕТ
✅ POST /favorites/toggle/:id       - СОВПАДАЕТ
❌ POST /bookings                   - ТРЕБУЕТ ИСПРАВЛЕНИЯ (ФОРМАТ ДАТЫ)
ℹ️  GET /bookings/my                - НЕ ИСПОЛЬЗУЕТСЯ (нужна на других экранах)
```

---

## 🎯 Что дальше

**Шаг 1:** Применить исправление 1 (форматирование даты)  
**Шаг 2:** Применить исправление 2 (проверка ответа)  
**Шаг 3:** Протестировать на эмуляторе  
**Шаг 4:** Запушить код  

**Время на исправления:** ~5 минут

---

## 💡 Полезные команды

### Быстро увидеть формат текущей даты
```bash
# В терминале Node.js
new Date("2024-06-01").toISOString()
// "2024-06-01T00:00:00.000Z"
```

### Проверить, совпадают ли даты
```typescript
const before = "2024-06-01";
const after = new Date("2024-06-01").toISOString();

console.log(new Date(before).getTime() === new Date(after).getTime());
// true - это одна и та же дата!
```

---

**Готово к применению! ✅**
