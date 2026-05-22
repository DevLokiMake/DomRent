import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Определяем baseURL в зависимости от платформы
 * - Android эмулятор: http://10.0.2.2:5000/api
 * - iOS и реальное устройство: http://<локальный IP>:5000/api
 */
const getBaseURL = (): string => {
  if (Platform.OS === 'android') {
    // Для Android эмулятора используем специальный адрес
    return 'http://10.0.2.2:5000/api';
  }

  // Для iOS и других платформ используем localhost
  // В боевом приложении здесь должен быть реальный IP хоста
  return 'http://localhost:5000/api';
};

export const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Интерцептор для добавления JWT токена из SecureStore
 * Автоматически подставляет Authorization: Bearer <token> в каждый запрос
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from SecureStore:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Интерцептор для обработки ошибок ответа
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Если получена ошибка 401, удаляем токен
      try {
        await SecureStore.deleteItemAsync('authToken');
      } catch (err) {
        console.error('Error deleting token:', err);
      }
      console.warn('Unauthorized: токен истёк или невалиден');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
