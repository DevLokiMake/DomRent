import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Heart,
  Home,
  Armchair,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import axiosInstance from '@/api/axios';
import { Property, PropertyWithOwner } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

interface PropertyDetails extends PropertyWithOwner {
  owner?: {
    id: number;
    name?: string;
    email: string;
    phone?: string;
  };
}

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Загрузка информации об объекте
  const fetchPropertyDetails = async () => {
    if (!id) {
      setError('ID объекта не найден');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await axiosInstance.get(`/properties/${id}`);
      setProperty(response.data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки объекта';
      setError(errorMessage);
      console.error('Failed to fetch property details:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !property) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>❌ {error || 'Объект не найден'}</ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.retryText}>Вернуться</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const hasMultipleImages = property.images && property.images.length > 1;

  // Функции для переключения изображений
  const handlePrevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex(
        currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1
      );
    }
  };

  const handleNextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex(
        currentImageIndex === property.images.length - 1 ? 0 : currentImageIndex + 1
      );
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await axiosInstance.post(`/favorites/toggle/${property.id}`);
      setIsFavorited(!isFavorited);
      Alert.alert(
        'Успех',
        isFavorited ? 'Удалено из избранного' : 'Добавлено в избранное'
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Ошибка', 'Не удалось изменить избранное');
    }
  };

  const handleBooking = () => {
    Alert.alert('Бронирование', 'Функция бронирования будет вскоре доступна');
  };

  const formattedPrice = property.price.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Определяем иконку типа объекта
  const getTypeIcon = () => {
    switch (property.type) {
      case 'квартира':
        return <Armchair size={20} color="#0a84ff" />;
      case 'дом':
        return <Home size={20} color="#0a84ff" />;
      case 'комната':
        return <DoorOpen size={20} color="#0a84ff" />;
      default:
        return <Home size={20} color="#0a84ff" />;
    }
  };

  const getTypeLabel = () => {
    switch (property.type) {
      case 'квартира':
        return 'Квартира';
      case 'дом':
        return 'Дом';
      case 'комната':
        return 'Комната';
      default:
        return property.type;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#0a84ff" />
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Детали объекта
        </ThemedText>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={24} color="#0a84ff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          {property.images && property.images.length > 0 ? (
            <>
              <Image
                source={{ uri: property.images[currentImageIndex] }}
                style={styles.mainImage}
              />

              {/* Image navigation buttons */}
              {hasMultipleImages && (
                <>
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonLeft]}
                    onPress={handlePrevImage}>
                    <ChevronLeft size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonRight]}
                    onPress={handleNextImage}>
                    <ChevronRight size={24} color="#fff" />
                  </TouchableOpacity>
                </>
              )}

              {/* Image counter */}
              {hasMultipleImages && (
                <View style={styles.imageCounter}>
                  <ThemedText style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {property.images.length}
                  </ThemedText>
                </View>
              )}

              {/* Image dots indicator */}
              {hasMultipleImages && (
                <View style={styles.dotsContainer}>
                  {property.images.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dot,
                        index === currentImageIndex && styles.dotActive,
                      ]}
                      onPress={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.mainImage, styles.noImage]}>
              <ThemedText>Нет изображения</ThemedText>
            </View>
          )}
        </View>

        {/* Price and Title Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceContainer}>
            <ThemedText type="title" style={styles.price}>
              {formattedPrice} ₸
            </ThemedText>
            <ThemedText style={styles.priceLabel}>за ночь</ThemedText>
          </View>

          <TouchableOpacity
            style={[styles.favoriteButton, isFavorited && styles.favoriteButtonActive]}
            onPress={handleToggleFavorite}>
            <Heart
              size={24}
              color={isFavorited ? '#ff3b30' : '#ccc'}
              fill={isFavorited ? '#ff3b30' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <ThemedText type="title" style={styles.title}>
          {property.title}
        </ThemedText>

        {/* Location and Type */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MapPin size={20} color="#0a84ff" />
            <ThemedText style={styles.infoText}>{property.city}</ThemedText>
          </View>

          <View style={styles.infoItem}>
            {getTypeIcon()}
            <ThemedText style={styles.infoText}>{getTypeLabel()}</ThemedText>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Описание
          </ThemedText>
          <ThemedText style={styles.description}>
            {property.description || 'Описание отсутствует'}
          </ThemedText>
        </View>

        {/* Owner Info Section */}
        {property.owner && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Контактное лицо
            </ThemedText>

            <View style={styles.ownerCard}>
              <View style={styles.ownerAvatar}>
                <ThemedText style={styles.ownerInitial}>
                  {property.owner.name?.charAt(0) || property.owner.email.charAt(0).toUpperCase()}
                </ThemedText>
              </View>

              <View style={styles.ownerInfo}>
                {property.owner.name && (
                  <ThemedText type="defaultSemiBold">{property.owner.name}</ThemedText>
                )}
                <ThemedText style={styles.ownerEmail}>{property.owner.email}</ThemedText>
                {property.owner.phone && (
                  <ThemedText style={styles.ownerPhone}>{property.owner.phone}</ThemedText>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Spacing for bottom buttons */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons at bottom */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.bookingButton]}
          onPress={handleBooking}>
          <ThemedText style={styles.bookingButtonText}>Забронировать</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    marginBottom: 12,
  },
  retryText: {
    fontSize: 14,
    color: '#0a84ff',
    fontWeight: '600',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  galleryContainer: {
    position: 'relative',
    marginHorizontal: -16,
    marginTop: 12,
    marginBottom: 12,
  },
  mainImage: {
    width: screenWidth,
    height: 280,
    backgroundColor: '#f0f0f0',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: 12,
  },
  navButtonRight: {
    right: 12,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  dotActive: {
    backgroundColor: '#0a84ff',
    width: 12,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0a84ff',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#ffe0e6',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    gap: 12,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0a84ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  ownerInfo: {
    flex: 1,
    gap: 4,
  },
  ownerEmail: {
    fontSize: 12,
    color: '#666',
  },
  ownerPhone: {
    fontSize: 12,
    color: '#0a84ff',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 20,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingButton: {
    backgroundColor: '#0a84ff',
  },
  bookingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
