# API изменения: Contract Type и City Management

## 📋 Обзор

Добавлены два основных изменения:
1. **Тип сделки (Contract Type)**: Поля `contractType` со значениями `'RENT'` или `'SALE'`
2. **Управление городами (City Model)**: Вместо строкового поля `city`, теперь используется связь с таблицей `City`

---

## 🔄 Обновления базы данных

### Prisma Schema

**Новый ENUM:**
```prisma
enum ContractType {
  RENT
  SALE
}
```

**Новая модель City:**
```prisma
model City {
  id         Int        @id @default(autoincrement())
  name       String     @unique
  properties Property[]
  createdAt  DateTime   @default(now())
}
```

**Обновлённая модель Property:**
```prisma
model Property {
  // ... существующие поля ...
  contractType ContractType @default(RENT)  // Новое поле
  cityId       Int                           // Новое поле (был city: String)
  city         City         @relation(...)  // Новая связь
}
```

---

## 📡 API Endpoints изменения

### 1️⃣ POST `/api/properties` - Создание недвижимости

**Обязательные параметры:**
- `title` (string) - Название
- `description` (string) - Описание
- `price` (number) - Цена
- `type` (enum) - Тип: 'квартира', 'дом', 'комната'
- **`contractType` (enum)** ✨ НОВОЕ - 'RENT' или 'SALE'
- `city` (string) - Название города (теперь автоматически создаётся в таблице City)
- `images` (array of strings) - URLs изображений

**Пример запроса:**
```json
{
  "title": "Уютная квартира",
  "description": "2 комнаты, балкон",
  "price": 50000,
  "type": "квартира",
  "contractType": "RENT",
  "city": "Москва",
  "images": ["https://example.com/img1.jpg"]
}
```

**Ответ (201):**
```json
{
  "message": "Объект успешно создан",
  "property": {
    "id": 1,
    "title": "Уютная квартира",
    "description": "2 комнаты, балкон",
    "price": 50000,
    "type": "квартира",
    "contractType": "RENT",
    "cityId": 5,
    "city": {
      "id": 5,
      "name": "Москва",
      "createdAt": "2026-05-28T16:00:00Z"
    },
    "images": ["https://example.com/img1.jpg"],
    "owner": { /* owner info */ },
    "createdAt": "2026-05-28T16:00:00Z",
    "updatedAt": "2026-05-28T16:00:00Z"
  }
}
```

**Логика города:**
- Если переданный город уже существует в таблице `City` → используется существующий ID
- Если города нет → автоматически создаётся новая запись в таблице `City`

---

### 2️⃣ GET `/api/properties` - Получение всех объектов

**Query параметры (фильтрация):**
- `city` (string) - Название города (например: `?city=Москва`)
- `cityId` (number) - ID города (например: `?cityId=5`)
- `type` (string) - Тип недвижимости
- `contractType` (string) ✨ НОВОЕ - 'RENT' или 'SALE' (например: `?contractType=RENT`)
- `minPrice` (number) - Минимальная цена
- `maxPrice` (number) - Максимальная цена

**Примеры запросов:**
```bash
# Получить все объекты аренды в Москве
GET /api/properties?contractType=RENT&city=Москва

# Получить только объекты на продажу
GET /api/properties?contractType=SALE

# Комбинированная фильтрация
GET /api/properties?contractType=RENT&city=СПб&minPrice=30000&maxPrice=80000
```

**Ответ:**
```json
{
  "count": 2,
  "properties": [
    {
      "id": 1,
      "title": "Квартира",
      "contractType": "RENT",
      "city": {
        "id": 5,
        "name": "Москва",
        "createdAt": "2026-05-28T16:00:00Z"
      },
      // ... остальные поля
    }
    // ...
  ]
}
```

---

### 3️⃣ GET `/api/properties/:id` - Получение объекта по ID

**Ответ теперь включает объект города:**
```json
{
  "property": {
    "id": 1,
    "title": "Квартира",
    "price": 50000,
    "contractType": "RENT",
    "city": {
      "id": 5,
      "name": "Москва",
      "createdAt": "2026-05-28T16:00:00Z"
    },
    "owner": { /* owner info */ },
    "bookings": [ /* bookings */ ],
    "favorites": [ /* favorites */ ],
    "_count": {
      "bookings": 2,
      "favorites": 3
    }
  }
}
```

---

### 4️⃣ PATCH `/api/properties/:id` - Обновление объекта

**Параметры (все необязательны):**
- `title`, `description`, `price`, `type`, `contractType`, `city`, `images`

**При обновлении города:**
- Если передан параметр `city` → автоматически ищется или создаётся город
- Если города нет → создаётся новая запись

**Пример:**
```json
{
  "contractType": "SALE",
  "city": "СПб"
}
```

---

## ✅ Валидация (Zod)

### Property Schema

```javascript
export const propertySchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().min(1, 'Описание обязательно'),
  price: z.number().positive('Цена должна быть положительной'),
  type: z.enum(['квартира', 'дом', 'комната']),
  contractType: z.enum(['RENT', 'SALE']), // ✨ НОВОЕ
  city: z.string().min(1, 'Город обязателен'),
  images: z.array(z.string().url()).optional()
});
```

**Ошибки валидации:**
```json
{
  "error": "Ошибка валидации",
  "details": [
    {
      "path": "contractType",
      "message": "Тип сделки должен быть RENT (Аренда) или SALE (Продажа)"
    }
  ]
}
```

---

## 🔧 Фронтенд изменения

### Web (React + TypeScript)

**CreatePropertyPage.tsx:**
```typescript
const [form, setForm] = useState({
  // ... существующие поля ...
  contractType: 'RENT', // ✨ НОВОЕ
});

// В форме добавить:
<select 
  name="contractType" 
  value={form.contractType}
  onChange={(e) => setForm({ ...form, contractType: e.target.value })}
>
  <option value="RENT">Аренда</option>
  <option value="SALE">Продажа</option>
</select>
```

### Mobile (React Native)

**Обновить `usePropertyDetails.ts`:**
```typescript
// При создании свойства
const bookingData = {
  title: '...',
  contractType: 'RENT', // ✨ НОВОЕ
  city: '...', // город автоматически обработается на сервере
  // ... остальные поля
};
```

---

## 🐛 Обработка ошибок

### Ошибка: Неверный contractType
```json
{
  "error": "Ошибка валидации",
  "details": [
    {
      "path": "contractType",
      "message": "Тип сделки должен быть RENT (Аренда) или SALE (Продажа)"
    }
  ]
}
```
**Решение:** Используйте только 'RENT' или 'SALE'

### Ошибка: Город не найден (при фильтрации)
```json
{
  "count": 0,
  "properties": []
}
```
**Решение:** Проверьте название города, используйте другой фильтр

---

## 📝 Миграция данных

При применении миграции:
1. Создана новая таблица `City`
2. Уникальные города из старого поля `city` автоматически добавлены в таблицу `City`
3. Все существующие объекты привязаны к соответствующему городу через `cityId`
4. Старое поле `city: String` удалено
5. Добавлено новое поле `contractType` с дефолтным значением `RENT`

---

## 🚀 Дополнительные возможности

### Получить список всех городов (если понадобится)

```javascript
// Backend route
app.get('/api/cities', async (req, res) => {
  const cities = await prisma.city.findMany({
    include: {
      _count: { select: { properties: true } }
    }
  });
  res.json({ cities });
});
```

**Ответ:**
```json
{
  "cities": [
    { "id": 1, "name": "Москва", "_count": { "properties": 5 } },
    { "id": 2, "name": "СПб", "_count": { "properties": 3 } }
  ]
}
```

---

## 📌 Резюме изменений

| Компонент | Что изменилось | Действие для фронтенда |
|-----------|-----------------|------------------------|
| **Property Model** | Добавлены `contractType` и `cityId` | Отправлять `contractType` при создании |
| **Валидация** | `contractType` обязателен | Проверить валидацию на фронтенде |
| **City** | Новая модель с автосозданием | Города создаются автоматически |
| **Фильтрация** | Новый параметр `contractType` | Использовать при поиске |
| **Ответы API** | Объект города в ответе | Обновить парсинг ответа |

