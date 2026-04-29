# DomRent

Платформа для поиска и бронирования недвижимости.

## Структура проекта

```
DomRent/
├── backend/          # Node.js + Express API
├── frontend/         # React веб-приложение
└── mobile/           # React Native мобильное приложение
```

## Backend

- **Технологии**: Node.js, Express.js, PostgreSQL, Prisma, JWT
- **Папка**: `backend/`
- **Запуск**: см. `backend/README.md`

## Frontend

- **Технологии**: React, Axios
- **Папка**: `frontend/`

## Mobile

- **Технологии**: React Native, Axios
- **Папка**: `mobile/`

## Функционал

- Регистрация и аутентификация пользователей
- Создание и управление объявлениями о недвижимости
- Поиск и фильтрация недвижимости
- Бронирование с проверкой дат
- Система избранного
- Уведомления через Telegram бот

## База данных

Схема: `backend/prisma/schema.prisma`

Таблицы:
- users
- properties
- property_images
- bookings
- favorites