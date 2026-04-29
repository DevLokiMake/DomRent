# DomRent — Платформа для поиска и бронирования недвижимости

## О проекте

**DomRent** — это полнофункциональная платформа для поиска и бронирования недвижимости с поддержкой веб и мобильных приложений. Платформа включает систему аутентификации, управление объявлениями, бронирование с проверкой дат, избранное и интеграцию с Telegram для уведомлений.

## Технологический стек

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **БД**: PostgreSQL
- **ORM**: Prisma
- **Аутентификация**: JWT (jsonwebtoken)
- **Криптография**: bcrypt, bcryptjs
- **API Security**: Helmet, CORS
- **Уведомления**: Telegram Bot API
- **Валидация**: Zod
- **Dev Tools**: Nodemon

### Frontend
- **Framework**: React 19.2
- **Язык**: TypeScript
- **Build Tool**: Vite
- **Стили**: Tailwind CSS + PostCSS
- **HTTP Client**: Axios
- **UI Icons**: Lucide React
- **Linting**: ESLint

### Mobile
- **Framework**: React Native
- **HTTP Client**: Axios

## Структура проекта

```
DomRent/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Контроллеры (auth, booking, property, user, favorite)
│   │   ├── routes/           # API маршруты
│   │   ├── middlewares/       # Middleware (auth)
│   │   ├── services/          # Бизнес-логика (telegramService)
│   │   ├── config/            # Конфигурация
│   │   └── utils/             # Утилиты
│   ├── prisma/
│   │   ├── schema.prisma      # Схема БД
│   │   ├── migrations/        # История миграций
│   │   └── seed.js            # Seed данные
│   ├── server.js              # Точка входа
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios конфигурация
│   │   ├── context/           # React Context (Auth)
│   │   ├── pages/             # Компоненты страниц
│   │   ├── assets/            # Статические ресурсы
│   │   ├── App.tsx            # Главный компонент
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── mobile/                    # React Native приложение
└── README.md
```

## Основные компоненты системы

### 1. **Аутентификация**
- Регистрация пользователей с хешированием пароля
- JWT-токены для авторизации
- Защита роутов через middleware

### 2. **Управление недвижимостью**
- Создание, редактирование, удаление объявлений
- Поддержка изображений
- Фильтрация и поиск

### 3. **Бронирование**
- Проверка доступности дат
- Управление бронированиями
- История бронирований

### 4. **Система избранного**
- Сохранение/удаление из избранного
- Просмотр избранных объектов

### 5. **Интеграция Telegram**
- Уведомления о новых бронированиях
- Уведомления о сообщениях

## Модель данных

### Основные таблицы (Prisma)
- **users** — Пользователи (email, пароль, профиль)
- **properties** — Объявления о недвижимости
- **property_images** — Изображения объектов
- **bookings** — Бронирования (с проверкой дат)
- **favorites** — Избранные объекты

## Руководство для разработчиков

### Запуск Backend

```bash
cd backend
npm install
npm run db:migrate       # Применить миграции
npm run db:seed          # Загрузить тестовые данные (опционально)
npm start                # Production: node server.js
npm run dev              # Development: nodemon server.js
```

### Запуск Frontend

```bash
cd frontend
npm install
npm run dev              # Development: Vite dev server
npm run build            # Production build
npm run lint             # ESLint проверка
```

### Переменные окружения (.env)

**Backend:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/domrent
JWT_SECRET=your-super-secret-key-here
PORT=3000
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

**Frontend:**
```
VITE_API_URL=http://localhost:3000
```

## API Endpoints

Основные категории:
- `/auth/*` — Аутентификация (регистрация, вход)
- `/properties/*` — Управление объявлениями
- `/bookings/*` — Управление бронированиями
- `/favorites/*` — Система избранного
- `/users/*` — Профиль пользователя

### Примеры смотри в:
- `backend/API_EXAMPLES.md` — Полный список всех endpoints

## Условности кодирования

### Backend (Node.js/Express)
- **Структура**: MVC (Models через Prisma, Views через JSON, Controllers)
- **Именование**: camelCase для переменных, функций
- **Модули**: ES6 imports (`import ... from ...`)
- **Файлы**: .js расширение
- **Валидация**: Zod schemas
- **Ошибки**: Нормализованные JSON ответы

### Frontend (React/TypeScript)
- **Структура**: Функциональные компоненты с Hooks
- **Типизация**: Строгий TypeScript (no `any`)
- **Стили**: Tailwind CSS классы
- **Компоненты**: PascalCase названия файлов
- **Состояние**: React Context для глобального стейта
- **API запросы**: Через Axios с обработкой ошибок

## Рекомендации

1. **Перед началом**: Прочитай `backend/API_EXAMPLES.md` для понимания API
2. **При работе с БД**: Используй Prisma CLI (`npx prisma studio` для визуализации)
3. **При добавлении feature**: Создай миграцию (`npm run db:migrate`)
4. **Git**: Коммитьте часто с понятными сообщениями
5. **Тестирование**: Используй Postman/Insomnia для API тестов
6. **Безопасность**: Никогда не коммитьте .env файлы

## Полезные команды

```bash
# Backend
npm run db:generate      # Генерировать Prisma Client
npm run db:push          # Push schema в БД без миграций
prisma studio           # Открыть Prisma Studio (UI для БД)

# Frontend
npm run lint             # Проверить код на ошибки
npm run build            # Собрать production версию

# Git
git clone <repo-url>    # Клонировать репозиторий
```

## Ссылки

📦 **GitHub**: [добавить ссылку на репозиторий]

## Контакты

При возникновении вопросов — обратись к документации в соответствующих папках проекта.

---

**Версия**: 1.0.0
**Последнее обновление**: Апрель 2026
