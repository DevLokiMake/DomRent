import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import axiosInstance from '@/api/axios';
import { Property } from '@/types';

interface PropertyCardProps {
  item: Property;
  onPress: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ item, onPress }) => {
  const formattedPrice = item.price.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {/* Изображение объекта */}
        {item.images && item.images.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
        )}

        {/* Контент карточки */}
        <View style={styles.cardContent}>
          {/* Название */}
          <ThemedText style={styles.title} numberOfLines={2}>
            {item.title}
          </ThemedText>

          {/* Цена */}
          <ThemedText style={styles.price} type="defaultSemiBold">
            {formattedPrice} ₸ / ночь
          </ThemedText>

          {/* Город */}
          <View style={styles.cityContainer}>
            <MapPin size={16} color="#666" />
            <ThemedText style={styles.city}>{item.city}</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
        </View>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка списка объектов недвижимости
  const fetchProperties = async () => {
    try {
      setError(null);
      const response = await axiosInstance.get('/properties');
      setProperties(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки объектов';
      setError(errorMessage);
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Загрузить данные при монтировании компонента
  useEffect(() => {
    fetchProperties();
  }, []);

  // Обновление при потягивании вниз
  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  // Навигация на детальный просмотр
  const handlePropertyPress = (propertyId: number) => {
    router.push(`/property/${propertyId}`);
  };

  // Состояние загрузки
  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <ThemedText style={styles.loadingText}>Загрузка объектов...</ThemedText>
      </ThemedView>
    );
  }

  // Состояние ошибки
  if (error && properties.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>❌ {error}</ThemedText>
        <ThemedText
          onPress={fetchProperties}
          style={styles.retryText}>
          Повторить попытку
        </ThemedText>
      </ThemedView>
    );
  }

  // Пустой список
  if (properties.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.emptyText}>Объектов не найдено</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={properties}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <PropertyCard
          item={item}
          onPress={() => handlePropertyPress(item.id)}
        />
      )}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0a84ff"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  price: {
    fontSize: 14,
    color: '#0a84ff',
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  city: {
    fontSize: 12,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
