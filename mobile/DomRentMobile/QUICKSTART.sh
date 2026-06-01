#!/bin/bash
# Быстрая настройка мобильного приложения DomRent
# Это скрипт-шпаргалка для быстрого запуска разработки

echo "🚀 DomRent Mobile - Quick Start Guide"
echo ""

# Получить IP адрес (работает на Windows, Mac, Linux)
echo "📍 Ваш локальный IP адрес:"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows (Git Bash или WSL)
  ipconfig | findstr IPv4 | head -1
elif [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1
else
  # Linux
  hostname -I | awk '{print $1}'
fi

echo ""
echo "✅ Что нужно сделать:"
echo ""
echo "1️⃣  Обновить IP адрес в api/config.ts"
echo "   Замените localhost на ваш IP адрес"
echo ""
echo "2️⃣  Убедиться, что бэкенд запущен:"
echo "   cd backend"
echo "   npm run start"
echo ""
echo "3️⃣  Запустить мобильное приложение:"
echo "   npm run android   # для Android эмулятора"
echo "   npm run ios       # для iOS эмулятора"
echo ""
echo "4️⃣  Проверить авторизацию:"
echo "   import { useAuth } from '@/context/AuthContext'"
echo "   const { login, user, isAuthenticated } = useAuth()"
echo ""
echo "🔐 Пакеты для авторизации:"
npm list --depth=0 | grep -E "@react-native-async-storage|expo-secure-store|axios" || echo "   (npm list --depth=0)"
echo ""
echo "📚 Документация:"
echo "   - AUTH_SETUP.md в текущей папке"
echo "   - api/config.ts для конфигурации API"
echo "   - context/AuthContext.tsx для логики авторизации"
echo ""
