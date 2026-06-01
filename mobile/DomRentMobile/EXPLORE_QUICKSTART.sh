#!/bin/bash
# 📱 DomRent Mobile - Экран поиска (Explore Screen)

echo "🔍 Экран поиска DomRent Mobile"
echo ""

echo "✅ Что было реализовано:"
echo "  1. ✨ FlatList - оптимизированный список с виртуализацией"
echo "  2. 📋 Карточки - красивые карточки объектов с изображениями"
echo "  3. 🔎 Фильтры - модальное окно с поиском и фильтрацией"
echo "  4. 📡 API - интеграция с бэкенд через axiosInstance"
echo "  5. 🎨 UI/UX - состояния загрузки, ошибки, пусто"
echo ""

echo "🚀 Быстрый старт:"
echo ""

echo "1️⃣  Убедитесь что IP адрес правильный:"
echo "   📄 Файл: api/axios.ts"
echo "   - Android эмулятор: http://10.0.2.2:5000/api ✅"
echo "   - iOS: замените localhost на ваш IP адрес"
echo ""

echo "2️⃣  Запустите мобильное приложение:"
echo "   npm run android"
echo "   # или"
echo "   npm run ios"
echo ""

echo "3️⃣  Проверьте, что экран открывается:"
echo "   - Нажмите на вкладку \"Explore\" (🔍 Поиск)"
echo "   - Должен загрузиться список объектов"
echo "   - Кнопка \"Фильтры\" в верхнем правом углу"
echo ""

echo "🎯 Файлы:"
echo "   📄 app/(tabs)/explore.tsx        - главный экран"
echo "   📄 app/property/[id].tsx         - экран деталей (уже существует)"
echo "   📄 EXPLORE_SCREEN.md             - полная документация"
echo "   📄 EXPLORE_EXAMPLES.tsx          - примеры расширений"
echo ""

echo "🔧 Кастомизация:"
echo "   1. Добавить избранное (пример 3 в EXPLORE_EXAMPLES.tsx)"
echo "   2. Бесконечный скролл (пример 4)"
echo "   3. Поиск в реальном времени (пример 5)"
echo "   4. Сортировка (пример 6)"
echo "   5. Кэширование (пример 7)"
echo ""

echo "📊 Структура запроса API:"
echo ""
echo "   GET /properties"
echo "   GET /properties?city=Алматы"
echo "   GET /properties?type=квартира&minPrice=10000&maxPrice=50000"
echo ""

echo "📱 Навигация:"
echo "   - Нажимаете на карточку → router.push(/property/\${id})"
echo "   - Видите детали объекта → app/property/[id].tsx"
echo "   - Возвращаетесь на список → автоматически"
echo ""

echo "❓ Если не работает:"
echo "   1. Проверьте API endpoint: http://192.168.X.X:5000/api/properties"
echo "   2. Посмотрите консоль: npx expo start (в терминале приложения)"
echo "   3. Убедитесь что бэкенд запущен"
echo "   4. Проверьте сетевое соединение (Wi-Fi одна сеть)"
echo ""

echo "📚 Документация:"
echo "   - AUTH_SETUP.md - настройка авторизации"
echo "   - EXPLORE_SCREEN.md - документация экрана"
echo "   - EXPLORE_EXAMPLES.tsx - примеры кода"
echo ""

echo "✨ Готово! Начните разработку! 🎉"
