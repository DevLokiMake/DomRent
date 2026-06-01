# Настройка Авторизации и API для Мобильного Приложения

## 📱 Обзор

Мобильное приложение DomRent использует:
- **AuthContext** (`context/AuthContext.tsx`) для управления состоянием авторизации
- **Axios Instance** (`api/axios.ts`) для HTTP запросов к бэкенду
- **SecureStore** для защищённого хранения JWT токена
- **AsyncStorage** для кэширования данных пользователя

## 🔑 Как работает авторизация

### 1. **Инициализация приложения**

При запуске приложения `AuthProvider` автоматически:
```typescript
const restoreSession = async () => {
  // 1. Читает токен из SecureStore
  const storedToken = await SecureStore.getItemAsync('authToken');
  
  // 2. Если токен есть, проверяет его и восстанавливает данные пользователя
  // GET /users/me с заголовком Authorization: Bearer <token>
  
  // 3. Если токен неверный, удаляет его
};
```

### 2. **Вход пользователя**

```typescript
const login = async (email: string, password: string) => {
  // 1. POST /auth/login { email, password }
  // 2. Получает response.data = { token, user }
  // 3. Сохраняет token в SecureStore.setItemAsync('authToken', token)
  // 4. Сохраняет user данные в AsyncStorage
  // 5. Обновляет осн ох-заголовок авторизации в axios
};
```

### 3. **Выход пользователя**

```typescript
const logout = async () => {
  // 1. Удаляет токен из SecureStore
  // 2. Удаляет user данные из AsyncStorage
  // 3. Очищает Authorization заголовок в axios
};
```

## 🌐 Настройка API Endpoint

### ⚠️ КРИТИЧЕСКИ ВАЖНО: Настройка IP адреса

По умолчанию приложение подключается к:
- **Android эмулятор**: `http://10.0.2.2:5000/api` ✅ (автоматически)
- **iOS эмулятор**: `http://localhost:5000/api` ❌ (НЕ РАБОТАЕТ)
- **Реальное устройство**: `http://localhost:5000/api` ❌ (НЕ РАБОТАЕТ)

### Как исправить для iOS и реальных устройств

**Шаг 1**: Узнайте IP адрес вашего компьютера

Windows (PowerShell):
```powershell
ipconfig
```
Найдите "IPv4 Address" в разделе вашей сети (например, `192.168.1.100`)

Mac/Linux (Terminal):
```bash
ifconfig
# или
ip addr
```

**Шаг 2**: Отредактируйте `api/axios.ts`

Найдите функцию `getBaseURL()`:

```typescript
// ДО (не работает на iOS):
const getBaseURL = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api'; // ❌ ЗАМЕНИТЕ ЭТО
};

// ПОСЛЕ (правильно для iOS):
const getBaseURL = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://192.168.1.100:5000/api'; // ✅ ЗАМЕНИТЕ НА ВАШ IP
};
```

**Шаг 3**: Переразберите приложение

```bash
npm run ios
# или для Android
npm run android
```

## 🔐 Использование контекста

### В компоненте

```typescript
import { useAuth } from '@/context/AuthContext';

export function LoginScreen() {
  const { login, isLoading, user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password123');
      // Пользователь авторизован!
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome, {user?.name}!</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

### Доступные методы и состояния

```typescript
const {
  // Состояние
  user: User | null,           // Данные текущего пользователя
  token: string | null,        // JWT токен
  isLoading: boolean,          // Идёт ли загрузка
  isAuthenticated: boolean,    // Авторизован ли пользователь

  // Методы
  login: (email, password) => Promise<void>,           // Вход
  logout: () => Promise<void>,                         // Выход
  signup: (email, password, name, role?) => Promise<void>,  // Регистрация
  restoreSession: () => Promise<void>                  // Восстановить сессию вручную
} = useAuth();
```

## 📡 Как работают интерцепторы

### Request Interceptor (автоматически добавляет токен)

```typescript
// Перед каждым запросом:
const token = await SecureStore.getItemAsync('authToken');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}

// Все запросы будут иметь заголовок:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response Interceptor (обработка 401 ошибок)

```typescript
if (error.response?.status === 401) {
  // Токен истёк или невалиден
  // 1. Удаляем токен из SecureStore
  // 2. Удаляем user из AsyncStorage
  // 3. Приложение должно перенаправить на экран логина
}
```

## 🚀 Примеры использования

### Пример 1: Защитить экран от неавторизованных пользователей

```typescript
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export function ProtectedScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return <Text>Вы авторизованы!</Text>;
}
```

### Пример 2: Выполнить запрос к API

```typescript
import { axiosInstance } from '@/api/axios';

export async function fetchProperties() {
  try {
    const response = await axiosInstance.get('/properties');
    console.log('Properties:', response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      // Пользователь не авторизован
    }
  }
}
```

## ✅ Чек-лист перед запуском

- [ ] `@react-native-async-storage/async-storage` установлен: `npm list @react-native-async-storage/async-storage`
- [ ] IP адрес в `api/axios.ts` соответствует вашему компьютеру (для iOS)
- [ ] Бэкенд запущен на порту 5000: `npm run start` в `backend/`
- [ ] Компьютер и мобильное устройство в одной сети Wi-Fi
- [ ] Брандмауэр не блокирует порт 5000

## 🐛 Решение проблем

### Ошибка: "Network Error" при подключении к API

**Решение**: Проверьте IP адрес в `api/axios.ts`

```bash
# Узнайте IP адрес вашего компьютера
ipconfig | findstr IPv4
```

### Ошибка: "401 Unauthorized" при каждом запросе

**Решение**: Токен не сохраняется или читается неправильно
- Проверьте, что SecureStore работает
- Убедитесь, что бэкенд возвращает `{ token, user }` в ответе

### Приложение не восстанавливает сессию

**Решение**: Очистите хранилище и перезапустите
```bash
npm run reset-project
npm run android
# или
npm run ios
```

## 📚 Дополнительные ресурсы

- [Expo SecureStore docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [AsyncStorage docs](https://react-native-async-storage.github.io/async-storage/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [React Native Networking](https://reactnative.dev/docs/network)
