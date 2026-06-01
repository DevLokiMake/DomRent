import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import axiosInstance from '@/api/axios';
import { PropertyWithOwner } from '@/types';

interface PropertyDetails extends PropertyWithOwner {
  owner?: {
    id: number;
    name?: string;
    email: string;
    phone?: string;
  };
}

interface UsePropertyDetailsReturn {
  property: PropertyDetails | null;
  isLoading: boolean;
  error: string | null;
  isFavorited: boolean;
  currentImageIndex: number;
  startDate: string;
  endDate: string;
  totalNights: number;
  totalPrice: number;
  setCurrentImageIndex: (index: number) => void;
  handleToggleFavorite: () => Promise<void>;
  handleBooking: () => Promise<void>;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

export function usePropertyDetails(): UsePropertyDetailsReturn {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Загрузка деталей объекта
  const fetchPropertyDetails = useCallback(async () => {
    if (!id) {
      setError('ID объекта не найден');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await axiosInstance.get<PropertyDetails>(`/properties/${id}`);
      setProperty(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки объекта';
      setError(errorMessage);
      console.error('Failed to fetch property details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Проверка, добавлен ли объект в избранное
  const checkFavoriteStatus = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axiosInstance.get<{ isFavorited: boolean }>(
        `/favorites/check/${id}`
      );
      setIsFavorited(response.data.isFavorited);
    } catch (err) {
      console.warn('Failed to check favorite status:', err);
    }
  }, [id]);

  // Загрузка при монтировании
  useEffect(() => {
    fetchPropertyDetails();
    checkFavoriteStatus();
  }, [id, fetchPropertyDetails, checkFavoriteStatus]);

  // Расчёт количества ночей
  const totalNights = startDate && endDate ? calculateNights(startDate, endDate) : 0;

  // Расчёт итоговой цены
  const totalPrice = totalNights && property ? totalNights * property.price : 0;

  // Переключение избранного
  const handleToggleFavorite = useCallback(async () => {
    if (!property) return;

    try {
      await axiosInstance.post(`/favorites/toggle/${property.id}`);
      setIsFavorited((prev) => !prev);
      Alert.alert(
        'Успех',
        isFavorited ? 'Удалено из избранного' : 'Добавлено в избранное'
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Ошибка', 'Не удалось изменить избранное');
    }
  }, [property, isFavorited]);

  // Отправка бронирования
  const handleBooking = useCallback(async () => {
    if (!property || !startDate || !endDate) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите даты заезда и выезда');
      return;
    }

    try {
      // Конвертируем даты в ISO 8601 формат, требуемый бэкендом
      const bookingData = {
        propertyId: property.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      await axiosInstance.post('/bookings', bookingData);

      Alert.alert('Успех', 'Бронирование создано! Ожидайте подтверждения владельца.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Не удалось создать бронирование. Попробуйте ещё раз.';
      console.error('Error creating booking:', err);
      Alert.alert('Ошибка', errorMsg);
    }
  }, [property, startDate, endDate, router]);

  return {
    property,
    isLoading,
    error,
    isFavorited,
    currentImageIndex,
    startDate,
    endDate,
    totalNights,
    totalPrice,
    setCurrentImageIndex,
    handleToggleFavorite,
    handleBooking,
    setStartDate,
    setEndDate,
  };
}

/**
 * Вспомогательная функция: расчёт количества ночей между двумя датами
 */
function calculateNights(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(diffDays));
  } catch {
    return 0;
  }
}
