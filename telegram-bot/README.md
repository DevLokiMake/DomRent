# DomRent Telegram Bot

Telegram-бот для платформы аренды недвижимости DomRent.

## Возможности

- Привязка аккаунта DomRent через одноразовый код
- Просмотр бронирований (`/mybookings`)
- Просмотр избранного (`/favorites`)
- Профиль пользователя (`/profile`)
- Обращения в поддержку (`/support`)
- Автоматические уведомления о бронированиях, одобрении/отклонении объявлений
- Административные функции: просмотр обращений, ответы, рассылка

## Структура проекта

```
telegram-bot/
├── src/
│   ├── bot.js                     # Точка входа
│   ├── config.js                  # Конфигурация из .env
│   ├── db.js                      # PostgreSQL пул + создание таблиц
│   ├── state.js                   # In-memory стейт для многошаговых диалогов
│   ├── server.js                  # HTTP-сервер для уведомлений от бэкенда
│   ├── controllers/
│   │   ├── startController.js
│   │   ├── authController.js      # /link, /unlink
│   │   ├── profileController.js   # /profile
│   │   ├── bookingsController.js  # /mybookings
│   │   ├── favoritesController.js # /favorites
│   │   ├── supportController.js   # /support
│   │   ├── adminController.js     # /admin, /broadcast
│   │   └── helpController.js      # /help
│   ├── services/
│   │   ├── apiService.js          # Запросы к DomRent REST API
│   │   ├── dbService.js           # Работа с bot_sessions, bot_support_tickets
│   │   └── notificationService.js # Форматирование уведомлений
│   ├── middlewares/
│   │   └── requireAuth.js         # Проверка привязки аккаунта
│   └── keyboards/
│       └── mainKeyboard.js        # Reply и inline клавиатуры
├── sql/
│   └── init.sql                   # Создание таблиц (выполнить один раз)
├── .env.example
└── package.json
```

## Быстрый старт

### 1. Создайте бота в Telegram

1. Откройте @BotFather в Telegram
2. Выполните `/newbot`
3. Получите токен и сохраните его

### 2. Настройте переменные окружения

```bash
cp .env.example .env
```

Заполните `.env`:

```env
TELEGRAM_BOT_TOKEN=1234567890:AABBccddEEffggHHiijjKK...
DOMRENT_API_URL=http://localhost:5000/api
BOT_API_KEY=any_random_secret_string
BOT_PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/domrent
ADMIN_CHAT_IDS=ваш_telegram_id
```

Узнать свой Telegram ID: запустите бота и напишите `/start`, ID придёт в ответе. Или используйте @userinfobot.

### 3. Создайте таблицы в БД

```bash
psql $DATABASE_URL -f sql/init.sql
```

### 4. Установите зависимости и запустите

```bash
npm install
npm start
```

Для разработки:
```bash
npm run dev
```

## Настройка бэкенда DomRent

Бот использует два новых эндпоинта бэкенда (уже добавлены в `backend/`):

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/telegram/generate-code` | Генерирует код привязки (требует JWT) |
| `POST` | `/api/telegram/link` | Верифицирует код, возвращает токен |
| `GET` | `/api/telegram/profile` | Профиль пользователя с counts (требует JWT) |

Для отправки уведомлений из бэкенда бот поднимает HTTP-сервер на `BOT_PORT` (по умолчанию 4000).

Бэкенд отправляет `POST http://localhost:4000/notify` с заголовком `x-bot-api-key`.

## Привязка аккаунта (пользователь)

1. Войти на domrent.kz
2. Профиль → Настройки → «Привязать Telegram»
3. Получить 6-значный код (действителен 10 минут)
4. Написать боту: `/link 123456`

## Доступные команды

| Команда | Описание |
|---------|----------|
| `/start` | Главное меню |
| `/link <код>` | Привязать аккаунт |
| `/unlink` | Отвязать аккаунт |
| `/profile` | Мой профиль |
| `/mybookings` | Мои бронирования |
| `/favorites` | Избранные объекты |
| `/support` | Написать в поддержку |
| `/help` | Список команд |
| `/admin` | Открытые обращения (только admin) |
| `/broadcast` | Рассылка всем (только admin) |
