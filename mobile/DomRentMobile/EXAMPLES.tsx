/**
 * Примеры использования AuthContext в компонентах мобильного приложения
 */

/**
 * ✅ ПРИМЕР 1: Простой экран логина
 */
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export function LoginScreenExample() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      await login(email, password);
      // После успешного входа, React Navigation перенаправит на главный экран
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />
      <TextInput
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />
      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Вход</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/**
 * ✅ ПРИМЕР 2: Защитить экран от неавторизованных пользователей
 */
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';

export function ProtectedScreenExample() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Редирект на экран логина если не авторизован
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Добро пожаловать, {user?.name}!
      </Text>
      <Text>Email: {user?.email}</Text>
      <Text>Роль: {user?.role}</Text>
    </View>
  );
}

/**
 * ✅ ПРИМЕР 3: Использование useAuth в сложной логике
 */
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { axiosInstance } from '@/api/axios';

interface Property {
  id: number;
  title: string;
  city: string;
  price: number;
}

export function PropertiesScreenExample() {
  const { user, isAuthenticated } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/properties');
        setProperties(response.data.properties);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [isAuthenticated]);

  // Бэкенд автоматически добавит токен благодаря Request Interceptor
  // Заголовок Authorization: Bearer <token> будет отправлен автоматически

  return (
    <View style={{ flex: 1 }}>
      {loading && <ActivityIndicator />}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {properties.map((prop) => (
        <View key={prop.id} style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text style={{ fontWeight: 'bold' }}>{prop.title}</Text>
          <Text>{prop.city} - {prop.price}₸</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * ✅ ПРИМЕР 4: Обработка 401 ошибок (автоматически)
 * 
 * Когда Response Interceptor получит 401:
 * 1. Удалит токен из SecureStore
 * 2. Очистит AsyncStorage
 * 3. Компонент заметит, что isAuthenticated = false и перенаправит на логин
 */
export function Auto401HandlerExample() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      // Любая 401 ошибка автоматически перенаправит сюда
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  return <Text>Вы авторизованы!</Text>;
}

/**
 * ✅ ПРИМЕР 5: Кнопка выхода
 */
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export function LogoutButtonExample() {
  const { logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // После выхода перенаправляем на логин
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      disabled={isLoading}
      style={{
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 5,
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
        Выход
      </Text>
    </TouchableOpacity>
  );
}

/**
 * ✅ ПРИМЕР 6: Регистрация нового пользователя
 */
export function SignupScreenExample() {
  const { signup, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'USER' | 'LANDLORD'>('USER');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      setError('');
      await signup(email, password, name, role);
      // После регистрации приложение автоматически авторизует пользователя
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <TextInput
        placeholder="Имя"
        value={name}
        onChangeText={setName}
        editable={!isLoading}
      />
      {/* Выбор роли */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={() => setRole('USER')} style={{ padding: 10 }}>
          <Text style={{ color: role === 'USER' ? 'blue' : 'gray' }}>
            Путешественник
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('LANDLORD')} style={{ padding: 10 }}>
          <Text style={{ color: role === 'LANDLORD' ? 'blue' : 'gray' }}>
            Арендодатель
          </Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <TouchableOpacity
        onPress={handleSignup}
        disabled={isLoading}
        style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 5 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * 💡 Ключевые особенности
 * 
 * 1. Токен автоматически добавляется к каждому запросу
 *    - Request Interceptor читает токен из SecureStore
 *    - Добавляет заголовок Authorization: Bearer <token>
 * 
 * 2. 401 ошибки обрабатываются автоматически
 *    - Response Interceptor удаляет токен при 401
 *    - Компонент заметит isAuthenticated = false и перенаправит на логин
 * 
 * 3. Сессия восстанавливается при запуске приложения
 *    - AuthProvider автоматически проверяет сохраненный токен
 *    - Получает данные пользователя если токен валиден
 * 
 * 4. Асинхронная работа с хранилищами
 *    - SecureStore для токена (защищенно)
 *    - AsyncStorage для данных пользователя (кэш)
 */
