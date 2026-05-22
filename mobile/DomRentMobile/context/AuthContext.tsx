import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '@/api/axios';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string, name: string, role?: 'USER' | 'LANDLORD') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Восстановление сессии при загрузке приложения
   */
  const restoreToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');

      if (storedToken) {
        setToken(storedToken);

        // Проверяем токен и получаем данные пользователя
        try {
          const response = await axiosInstance.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.data && response.data.user) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.warn('Failed to restore session:', error);
          // Если токен невалиден, очищаем его
          await SecureStore.deleteItemAsync('authToken');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error restoring token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Загрузить токен при инициализации приложения
   */
  useEffect(() => {
    restoreToken();
  }, []);

  /**
   * Регистрация нового пользователя
   */
  const signUp = async (email: string, password: string, name: string, role: 'USER' | 'LANDLORD' = 'USER') => {
    try {
      setIsLoading(true);

      const response = await axiosInstance.post('/auth/register', {
        email,
        password,
        name,
        role,
      });

      if (response.data && response.data.token && response.data.user) {
        // Сохраняем токен в защищённое хранилище
        await SecureStore.setItemAsync('authToken', response.data.token);

        setToken(response.data.token);
        setUser(response.data.user);

        // Обновляем заголовок по умолчанию для axios
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Вход пользователя
   */
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      if (response.data && response.data.token && response.data.user) {
        // Сохраняем токен в защищённое хранилище
        await SecureStore.setItemAsync('authToken', response.data.token);

        setToken(response.data.token);
        setUser(response.data.user);

        // Обновляем заголовок по умолчанию для axios
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Выход пользователя
   */
  const signOut = async () => {
    try {
      setIsLoading(true);

      // Удаляем токен из защищённого хранилища
      await SecureStore.deleteItemAsync('authToken');

      // Очищаем заголовок авторизации
      delete axiosInstance.defaults.headers.common['Authorization'];

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isSignedIn: !!user && !!token,
    signUp,
    signIn,
    signOut,
    restoreToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook для использования Auth контекста
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
