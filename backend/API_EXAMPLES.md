# Примеры запросов для DomRent API

## Аутентификация

### Регистрация
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "landlord"
}

### Логин
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

## Пользователь

### Получить профиль
GET /api/user/me
Authorization: Bearer <token>

### Обновить профиль
PUT /api/user/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+0987654321"
}

## Недвижимость

### Создать объявление (только для LANDLORD)
POST /api/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Beautiful Apartment",
  "description": "Spacious 2-bedroom apartment with balcony",
  "price": 1500.00,
  "city": "Almaty",
  "type": "квартира",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}

### Получить список с фильтрами (публичный)
GET /api/properties?city=Almaty&minPrice=1000&maxPrice=2000&type=квартира

### Получить одно объявление (публичный)
GET /api/properties/{id}

### Обновить объявление (только владелец)
PUT /api/properties/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 1600.00
}

### Удалить объявление (только владелец)
DELETE /api/properties/{id}
Authorization: Bearer <token>

## Бронирование

### Создать бронирование (требует аутентификацию)
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": 1,
  "startDate": "2024-06-01T10:00:00Z",
  "endDate": "2024-06-07T10:00:00Z"
}

Ответ включает:
- id: ID бронирования
- userId: ID пользователя
- propertyId: ID объекта
- startDate: начало бронирования
- endDate: конец бронирования
- totalPrice: автоматически вычисленная стоимость (дни * цена за ночь)
- property: полная информация об объекте
- createdAt: время создания бронирования

### Получить все бронирования пользователя (требует аутентификацию)
GET /api/bookings/my
Authorization: Bearer <token>

Возвращает список всех бронирований текущего пользователя с информацией об объектах

### Отменить бронирование (требует аутентификацию и принадлежность)
DELETE /api/bookings/{id}
Authorization: Bearer <token>

Может отменить бронирование только его владелец

## Избранное

### Переключение добавления/удаления в избранное (требует аутентификацию)
POST /api/favorites/toggle/{propertyId}
Authorization: Bearer <token>

Если объект уже в избранном — удалит его
Если объект не в избранном — добавит его

Ответ при добавлении:
{
  "message": "Объект добавлен в избранное",
  "action": "added",
  "favorite": { ...full property data... }
}

Ответ при удалении:
{
  "message": "Объект удален из избранного",
  "action": "removed",
  "propertyId": 1
}

### Получить все избранные объекты (требует аутентификацию)
GET /api/favorites
Authorization: Bearer <token>

Возвращает список всех Property объектов, добавленных в избранное

### Проверить, добавлен ли объект в избранное (требует аутентификацию)
GET /api/favorites/check/{propertyId}
Authorization: Bearer <token>

Возвращает: { "propertyId": 1, "isFavorited": true/false }