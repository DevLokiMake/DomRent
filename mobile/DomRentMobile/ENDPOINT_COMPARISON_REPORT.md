# 📊 Отчет сравнения эндпоинтов Backend vs Frontend

**Дата проверки:** 28 мая 2026  
**Проверено эндпоинтов:** 5 (из hooks/usePropertyDetails.ts)  
**Критических проблем:** ⚠️ 1  
**Рекомендаций:** 3  

---

## 📋 Таблица сравнения всех эндпоинтов

| # | Операция | Frontend URL | Backend URL | HTTP | Данные | Статус |
|---|----------|------------|---------|------|--------|--------|
| 1 | Получение деталей объекта | `/properties/${id}` | `/api/properties/:id` | GET | - | ✅ |
| 2 | Проверка избранного | `/favorites/check/${id}` | `/api/favorites/check/:propertyId` | GET | - | ✅ |
| 3 | Toggle избранное | `/favorites/toggle/${property.id}` | `/api/favorites/toggle/:propertyId` | POST | - | ✅ |
| 4 | Создать бронирование | `/bookings` | `/api/bookings` | POST | ❌ ⚠️ | ⚠️ |
| 5 | Получить бронирования | ❌ Отсутствует | `/api/bookings/my` | GET | - | ⚠️ |

---

## 🔍 ДЕТАЛЬНЫЙ АНАЛИЗ КАЖДОГО ЭНДПОИНТА

### 1️⃣ GET - Получение деталей объекта

#### Frontend (usePropertyDetails.ts, строка 52):
```typescript
const response = await axiosInstance.get<PropertyDetails>(`/properties/${id}`);
setProperty(response.data);
```

#### Backend (routes/property.js, строка 17):
```javascript
router.get('/:id', getPropertyById);
```

**Сравнение:**
| Параметр | Frontend | Backend | Совпадает |
|----------|----------|---------|-----------|
| URL | `/properties/${id}` | `/api/properties/:id` | ✅ |
| HTTP метод | GET | GET | ✅ |
| Query параметры | - | - | ✅ |
| Body | - | - | ✅ |
| Аутентификация | Да (axiosInstance) | Нет (публичный) | ✅ |

**Статус:** ✅ **ПОЛНОЕ СОВПАДЕНИЕ**

---

### 2️⃣ GET - Проверка добавлен ли объект в избранное

#### Frontend (usePropertyDetails.ts, строка 64):
```typescript
const response = await axiosInstance.get<{ isFavorited: boolean }>(
  `/favorites/check/${id}`
);
setIsFavorited(response.data.isFavorited);
```

#### Backend:
**Route (routes/favorite.js, строка 13):**
```javascript
router.get('/check/:propertyId', authenticateToken, isFavorited);
```

**Controller (favoriteController.js, строка 169):**
```javascript
export const isFavorited = async (req, res) => {
  const { propertyId } = req.params;
  // Валидация и проверка в БД
  res.json({
    propertyId: parsed.data.propertyId,
    isFavorited: !!favorite
  });
};
```

**Сравнение:**
| Параметр | Frontend | Backend | Совпадает |
|----------|----------|---------|-----------|
| URL | `/favorites/check/${id}` | `/api/favorites/check/:propertyId` | ✅ |
| HTTP метод | GET | GET | ✅ |
| Path параметр | `id` | `propertyId` | ✅ |
| Ответ структура | `{ isFavorited: boolean }` | `{ propertyId, isFavorited }` | ✅ |
| Аутентификация | Да | Да | ✅ |

**Статус:** ✅ **ПОЛНОЕ СОВПАДЕНИЕ**

---

### 3️⃣ POST - Добавить/Удалить из избранного

#### Frontend (usePropertyDetails.ts, строка 79):
```typescript
await axiosInstance.post(`/favorites/toggle/${property.id}`);
setIsFavorited((prev) => !prev);
```

#### Backend:
**Route (routes/favorite.js, строка 8):**
```javascript
router.post('/toggle/:propertyId', authenticateToken, toggleFavorite);
```

**Controller (favoriteController.js, строка 6):**
```javascript
export const toggleFavorite = async (req, res) => {
  const { propertyId } = req.params;
  // Валидация propertyId
  // Если в избранном - удалить, иначе - добавить
  res.json({ message: '...', action: 'removed|added', propertyId });
};
```

**Сравнение:**
| Параметр | Frontend | Backend | Совпадает |
|----------|----------|---------|-----------|
| URL | `/favorites/toggle/${property.id}` | `/api/favorites/toggle/:propertyId` | ✅ |
| HTTP метод | POST | POST | ✅ |
| Path параметр | `property.id` | `propertyId` | ✅ |
| Body | - | - | ✅ |
| Аутентификация | Да | Да | ✅ |
| Ответ | Игнорируется | JSON с action | ✅ |

**Статус:** ✅ **ПОЛНОЕ СОВПАДЕНИЕ**

---

### 4️⃣ POST - Создать бронирование ⚠️

#### Frontend (usePropertyDetails.ts, строка 113):
```typescript
const bookingData = {
  propertyId: property.id,
  startDate,  // Формат: "2024-06-01"
  endDate,    // Формат: "2024-06-05"
};
await axiosInstance.post('/bookings', bookingData);
```

#### Backend:
**Route (routes/booking.js, строка 14):**
```javascript
router.post('/', authenticateToken, validate(bookingSchema), createBooking);
```

**Validation (validate.js, строка 41):**
```javascript
export const bookingSchema = z.object({
  propertyId: z.number().int().positive('...'),
  startDate: z.string().datetime('...').or(z.date()),
  endDate: z.string().datetime('...').or(z.date())
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;  // end > start
  },
  { message: 'Конечная дата должна быть позже начальной даты' }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const now = new Date();
    return start >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },
  { message: 'Дата начала не может быть в прошлом' }
);
```

**Сравнение:**
| Параметр | Frontend | Backend | Совпадает |
|----------|----------|---------|-----------|
| URL | `/bookings` | `/api/bookings` | ✅ |
| HTTP метод | POST | POST | ✅ |
| propertyId | `number` | `number` | ✅ |
| startDate | `string ("2024-06-01")` | `datetime ISO 8601` | ⚠️ |
| endDate | `string ("2024-06-05")` | `datetime ISO 8601` | ⚠️ |
| Валидация дат | Да (в usePropertyDetails) | Да (в backend) | ✅ |
| Аутентификация | Да | Да | ✅ |

**Сравнение значений:**
```typescript
// Frontend отправляет:
{ 
  propertyId: 1,
  startDate: "2024-06-01",      // ❌ НЕ ISO 8601 datetime
  endDate: "2024-06-05"          // ❌ НЕ ISO 8601 datetime
}

// Backend ожидает:
z.string().datetime('Формат должен быть ISO 8601').or(z.date())

// Примеры ISO 8601:
"2024-06-01T00:00:00Z"         // ✅ ISO 8601 с временем
"2024-06-01T00:00:00+00:00"    // ✅ ISO 8601 с временем
"2024-06-01"                    // ⚠️ Может не пройти валидацию
```

**Статус:** ⚠️ **ПОТЕНЦИАЛЬНАЯ ПРОБЛЕМА**

---

### 5️⃣ GET - Получить мои бронирования ❌

#### Frontend (usePropertyDetails.ts):
```typescript
// ❌ ОТСУТСТВУЕТ - нет запроса
```

#### Backend (routes/booking.js, строка 19):
```javascript
router.get('/my', authenticateToken, getUserBookings);
```

**Статус:** ⚠️ **ФУНКЦИЯ НЕ ИСПОЛЬЗУЕТСЯ** (но она нужна на других экранах!)

---

## 🚨 НАЙДЕННЫЕ ПРОБЛЕМЫ

### ⚠️ Проблема 1: Формат даты для бронирования (КРИТИЧЕСКАЯ)

**Описание:**
Frontend отправляет даты в формате `YYYY-MM-DD` (например `"2024-06-01"`), но backend ожидает полный ISO 8601 datetime (например `"2024-06-01T00:00:00Z"`).

**Где найти:**
- Frontend: `hooks/usePropertyDetails.ts`, строка 113-115
- Backend: `middlewares/validate.js`, строка 41-42

**Текущий код Frontend:**
```typescript
const bookingData = {
  propertyId: property.id,
  startDate,  // "2024-06-01" ❌
  endDate,    // "2024-06-05" ❌
};
```

**Ожидаемое:**
```typescript
const bookingData = {
  propertyId: property.id,
  startDate: startDate + "T00:00:00Z",  // "2024-06-01T00:00:00Z" ✅
  endDate: endDate + "T23:59:59Z",      // "2024-06-05T23:59:59Z" ✅
};
```

**Вероятность ошибки:** 🔴 **ВЫСОКАЯ**  
Backend валидация `z.string().datetime()` может отклонить формат `YYYY-MM-DD`.

**Рекомендуемое решение:**
```typescript
// Вариант 1: Преобразовать на фронте
const bookingData = {
  propertyId: property.id,
  startDate: new Date(startDate).toISOString(),
  endDate: new Date(endDate).toISOString(),
};

// Вариант 2: Обновить backend валидацию (менее рекомендуемо)
startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '...').or(z.date())
```

---

### ⚠️ Проблема 2: Обработка временных зон

**Описание:**
При работе с датами бронирования нужно учитывать временные зоны. Если пользователь в одной зоне, а сервер в другой, даты могут сдвинуться.

**Пример ошибки:**
```
Пользователь: Алматы (UTC+6)
Сервер: UTC+0

Пользователь выбирает: 2024-06-01 (в Алматы)
Frontend отправляет: 2024-06-01 00:00:00
Backend получает: 2024-05-31 18:00:00 (в UTC)
Backend сохраняет: 2024-05-31 ❌ НЕПРАВИЛЬНО
```

**Рекомендуемое решение:**
Всегда использовать UTC на сервере и конвертировать на клиенте.

---

### ⚠️ Проблема 3: Структура ответа при создании бронирования

**Описание:**
Frontend не проверяет структуру ответа от `POST /bookings`.

**Frontend код:**
```typescript
await axiosInstance.post('/bookings', bookingData);
Alert.alert('Успех', 'Бронирование создано!');
```

**Backend может вернуть:**
- `{ message: '...', booking: {...} }` (успех)
- `{ message: '...', action: 'added' }` (успех)
- `{ error: '...' }` (ошибка)

Код работает только если нет ошибки, но не проверяет содержимое.

**Рекомендуемое решение:**
```typescript
const response = await axiosInstance.post('/bookings', bookingData);
// Проверить response.data.booking или response.data.id
if (!response.data.booking || !response.data.booking.id) {
  throw new Error('Неверный формат ответа от сервера');
}
```

---

## ✅ ИДЕНТИЧНЫЕ ЭНДПОИНТЫ (БЕЗ ПРОБЛЕМ)

### 1. GET /properties/:id ✅
- Frontend отправляет: `/properties/${id}`
- Backend слушает: `/api/properties/:id`
- ✅ Совпадает идеально

### 2. GET /favorites/check/:propertyId ✅
- Frontend отправляет: `/favorites/check/${id}`
- Backend слушает: `/api/favorites/check/:propertyId`
- ✅ Параметры совпадают

### 3. POST /favorites/toggle/:propertyId ✅
- Frontend отправляет: `/favorites/toggle/${property.id}`
- Backend слушает: `/api/favorites/toggle/:propertyId`
- ✅ Параметры совпадают

---

## 📊 Итоговая таблица проблем

| Эндпоинт | Проблема | Серьезность | Статус |
|----------|---------|-------------|--------|
| POST /bookings | Формат даты | 🔴 Высокая | ❌ Требует исправления |
| POST /bookings | Временная зона | 🟡 Средняя | ⚠️ Требует внимания |
| POST /bookings | Проверка ответа | 🟡 Средняя | ⚠️ Рекомендуется |
| GET /bookings/my | Не используется | 🟡 Низкая | ℹ️ Информационно |

---

## 🔧 РЕКОМЕНДУЕМЫЕ ИСПРАВЛЕНИЯ

### Исправление 1: Форматирование даты (ОБЯЗАТЕЛЬНО)

**Файл:** `hooks/usePropertyDetails.ts`

**Текущий код (строка 113):**
```typescript
const bookingData = {
  propertyId: property.id,
  startDate,
  endDate,
};
```

**Исправленный код:**
```typescript
const bookingData = {
  propertyId: property.id,
  startDate: new Date(startDate).toISOString(),
  endDate: new Date(endDate).toISOString(),
};
```

**Или альтернатива (если даты в формате YYYY-MM-DD):**
```typescript
const bookingData = {
  propertyId: property.id,
  startDate: `${startDate}T00:00:00Z`,
  endDate: `${endDate}T23:59:59Z`,
};
```

---

### Исправление 2: Добавить проверку ответа (РЕКОМЕНДУЕТСЯ)

**Файл:** `hooks/usePropertyDetails.ts`

**Текущий код (строка 120):**
```typescript
await axiosInstance.post('/bookings', bookingData);

Alert.alert('Успех', 'Бронирование создано! ...', [
  {
    text: 'OK',
    onPress: () => router.back(),
  },
]);
```

**Исправленный код:**
```typescript
const response = await axiosInstance.post('/bookings', bookingData);

// Проверка успешного создания
if (!response.data || !response.data.booking) {
  throw new Error('Неверный формат ответа от сервера');
}

Alert.alert('Успех', 'Бронирование создано! Ожидайте подтверждения владельца.', [
  {
    text: 'OK',
    onPress: () => router.back(),
  },
]);
```

---

### Альтернатива: Обновить Backend валидацию (НЕ РЕКОМЕНДУЕТСЯ)

Если требуется поддержка формата `YYYY-MM-DD`:

**Файл:** `middlewares/validate.js`

**Текущий код:**
```javascript
startDate: z.string().datetime('...').or(z.date()),
```

**Исправленный код:**
```javascript
startDate: z.union([
  z.string().datetime('Формат: ISO 8601 (2024-06-01T00:00:00Z)'),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат: YYYY-MM-DD'),
  z.date()
]),
```

Но это **не рекомендуется**, лучше форматировать на фронте.

---

## 📝 Итоговый чек-лист

- [ ] ✅ GET /properties/:id - Совпадает идеально
- [ ] ✅ GET /favorites/check/:id - Совпадает идеально
- [ ] ✅ POST /favorites/toggle/:id - Совпадает идеально
- [ ] ❌ POST /bookings - Требует исправления (формат даты)
- [ ] ⚠️ POST /bookings - Рекомендуется добавить проверку ответа
- [ ] ℹ️ GET /bookings/my - Не используется в usePropertyDetails (но нужна на других экранах)

---

## 🎯 ЗАКЛЮЧЕНИЕ

**Статус:** ⚠️ **ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ**

**Критические проблемы:** 1 (формат даты)  
**Рекомендуемые улучшения:** 2  
**Полностью совпадающих эндпоинтов:** 3 из 5

**Срочность:** 🔴 **ВЫСОКАЯ** - Ошибка в формате даты может привести к отказу бронирования на production.

---

**Рекомендация:** Применить исправление 1 (форматирование даты) перед деплоем на production.
