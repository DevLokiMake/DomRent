import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Создание экземпляра axios с baseURL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Интерцептор запроса
 * Добавляет JWT токен из localStorage в заголовок Authorization
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Интерцептор ответа
 * Обрабатывает ошибки и ошибки авторизации
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Если ошибка 401, удалить токен и перенаправить на страницу входа
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
