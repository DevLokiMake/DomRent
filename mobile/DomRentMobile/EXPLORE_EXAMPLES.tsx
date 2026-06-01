/**
 * Расширенные примеры для экрана Explore (app/(tabs)/explore.tsx)
 */

/**
 * 📌 ПРИМЕР 1: Сохранение последних фильтров в AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// При применении фильтров:
const handleApplyFilters = async () => {
  setActiveFilters(filters);
  // Сохранить фильтры
  await AsyncStorage.setItem('lastSearchFilters', JSON.stringify(filters));
  setShowFilters(false);
  await fetchProperties(filters);
};

// При загрузке экрана:
useEffect(() => {
  const loadLastFilters = async () => {
    try {
      const saved = await AsyncStorage.getItem('lastSearchFilters');
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        setFilters(parsedFilters);
        setActiveFilters(parsedFilters);
        // Загрузить с последними фильтрами
        await fetchProperties(parsedFilters);
      } else {
        // Загрузить все
        await fetchProperties();
      }
    } catch (error) {
      console.error('Error loading last filters:', error);
      await fetchProperties();
    }
  };

  loadLoadLastFilters();
}, []);

/**
 * 📌 ПРИМЕР 2: Добавить фильтр по рейтингу (для будущего)
 */
import { View, Slider } from 'react-native';

interface FilterState {
  city: string;
  type: 'все' | 'квартира' | 'дом' | 'комната';
  minPrice: string;
  maxPrice: string;
  minRating: number; // НОВОЕ
}

// В компоненте:
<View style={styles.filterGroup}>
  <ThemedText style={styles.filterLabel}>Минимальный рейтинг: {filters.minRating}</ThemedText>
  <Slider
    style={{ height: 40 }}
    minimumValue={0}
    maximumValue={5}
    step={0.5}
    value={filters.minRating}
    onValueChange={(value) => updateFilter('minRating', value.toString())}
  />
</View>;

/**
 * 📌 ПРИМЕР 3: Интеграция с системой избранного
 */
import { Heart } from 'lucide-react-native';

// В renderPropertyCard:
const [favorites, setFavorites] = useState<Set<number>>(new Set());

const handleToggleFavorite = async (propertyId: number, e: any) => {
  e.stopPropagation(); // Не переходить на детали

  try {
    await axiosInstance.post(`/favorites/toggle/${propertyId}`);

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      return newFavorites;
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};

// На карточке:
<View style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
  <TouchableOpacity
    onPress={(e) => handleToggleFavorite(item.id, e)}
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Heart
      size={20}
      color={favorites.has(item.id) ? '#FF3B30' : '#ccc'}
      fill={favorites.has(item.id) ? '#FF3B30' : 'none'}
    />
  </TouchableOpacity>
</View>;

/**
 * 📌 ПРИМЕР 4: Бесконечный скролл (Load More)
 */
// Добавить состояние:
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

// Обновить fetchProperties:
const fetchProperties = useCallback(
  async (appliedFilters: FilterState = activeFilters, pageNum: number = 1) => {
    try {
      if (pageNum === 1) setLoading(true);

      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '10');

      // ... остальное построение query ...

      const response = await axiosInstance.get(url);
      const newProperties = response.data.properties || response.data.data || response.data;

      if (pageNum === 1) {
        setProperties(newProperties);
      } else {
        setProperties((prev) => [...prev, ...newProperties]);
      }

      setHasMore(newProperties.length === 10);
      setPage(pageNum);
    } catch (error) {
      // ... обработка ошибки ...
    }
  },
  [activeFilters]
);

// В FlatList:
<FlatList
  onEndReached={() => {
    if (hasMore && !loading) {
      fetchProperties(activeFilters, page + 1);
    }
  }}
  onEndReachedThreshold={0.5}
/>;

/**
 * 📌 ПРИМЕР 5: Поиск в реальном времени (Search Bar)
 */
import { debounce } from 'lodash'; // npm install lodash

const [searchQuery, setSearchQuery] = useState('');

const debouncedSearch = useCallback(
  debounce(async (query: string) => {
    if (query.length > 2) {
      const newFilters = { ...activeFilters, city: query };
      setActiveFilters(newFilters);
      await fetchProperties(newFilters);
    }
  }, 500),
  [activeFilters]
);

const handleSearchChange = (text: string) => {
  setSearchQuery(text);
  debouncedSearch(text);
};

// В header:
<View style={styles.searchContainer}>
  <TextInput
    style={styles.searchInput}
    placeholder="Поиск города..."
    value={searchQuery}
    onChangeText={handleSearchChange}
  />
</View>;

/**
 * 📌 ПРИМЕР 6: Сортировка объектов
 */
type SortBy = 'price_asc' | 'price_desc' | 'recent' | 'popular';

const [sortBy, setSortBy] = useState<SortBy>('recent');

const handleSort = async (newSort: SortBy) => {
  setSortBy(newSort);

  // На бэкенде должен быть параметр sort
  const newFilters = { ...activeFilters, sort: newSort };
  await fetchProperties(newFilters);
};

// UI кнопки сортировки:
<View style={styles.sortContainer}>
  {(['recent', 'price_asc', 'price_desc'] as const).map((sort) => (
    <TouchableOpacity
      key={sort}
      onPress={() => handleSort(sort)}
      style={[styles.sortButton, sortBy === sort && styles.sortButtonActive]}
    >
      <ThemedText>
        {sort === 'recent'
          ? '🕐 Новые'
          : sort === 'price_asc'
            ? '💰 Дешевле'
            : '💸 Дороже'}
      </ThemedText>
    </TouchableOpacity>
  ))}
</View>;

/**
 * 📌 ПРИМЕР 7: Кэширование данных
 */
import { useFocusEffect } from '@react-navigation/native';

const cacheRef = useRef<{
  data: Property[];
  timestamp: number;
  filters: FilterState;
} | null>(null);

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

const fetchProperties = useCallback(
  async (appliedFilters: FilterState = activeFilters) => {
    // Проверить кэш
    if (
      cacheRef.current &&
      JSON.stringify(cacheRef.current.filters) === JSON.stringify(appliedFilters) &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setProperties(cacheRef.current.data);
      setLoading(false);
      return;
    }

    // Загрузить с сервера
    try {
      setLoading(true);
      // ... запрос ...
      const newProperties = response.data.properties;

      // Обновить кэш
      cacheRef.current = {
        data: newProperties,
        timestamp: Date.now(),
        filters: appliedFilters,
      };

      setProperties(newProperties);
    } catch (error) {
      // ... обработка ошибки ...
    }
  },
  [activeFilters]
);

/**
 * 📌 ПРИМЕР 8: Показать количество результатов
 */
// В header вместе с фильтрами:
<View style={styles.resultsInfo}>
  <ThemedText>
    Найдено объектов: <ThemedText style={{ fontWeight: '700' }}>{properties.length}</ThemedText>
  </ThemedText>
  {activeFilterCount > 0 && (
    <TouchableOpacity onPress={handleResetFilters}>
      <ThemedText style={{ color: '#007AFF', textDecorationLine: 'underline' }}>
        Очистить фильтры
      </ThemedText>
    </TouchableOpacity>
  )}
</View>;

/**
 * 📌 ПРИМЕР 9: Карточка с рейтингом
 */
// Предполагается, что Property имеет поле rating
interface PropertyWithRating extends Property {
  rating?: number;
  reviewCount?: number;
}

// На карточке:
{
  item.rating && (
    <View style={styles.ratingContainer}>
      <ThemedText style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</ThemedText>
      <ThemedText style={styles.reviewCountText}>({item.reviewCount} отзывов)</ThemedText>
    </View>
  );
}

/**
 * 📌 ПРИМЕР 10: Быстрые фильтры (Quick Filters)
 */
// Часто используемые города
const POPULAR_CITIES = ['Алматы', 'Нур-Султан', 'Шымкент'];

<View style={styles.quickFilters}>
  <ThemedText style={styles.quickFiltersLabel}>Популярные города:</ThemedText>
  <View style={styles.quickFiltersButtons}>
    {POPULAR_CITIES.map((city) => (
      <TouchableOpacity
        key={city}
        onPress={() => {
          const newFilters = { ...activeFilters, city };
          setActiveFilters(newFilters);
          fetchProperties(newFilters);
        }}
        style={styles.quickFilterButton}
      >
        <ThemedText style={styles.quickFilterButtonText}>{city}</ThemedText>
      </TouchableOpacity>
    ))}
  </View>
</View>;

/**
 * Дополнительные стили для примеров:
 * 
 * quickFilters: {
 *   paddingHorizontal: 16,
 *   paddingVertical: 12,
 *   borderBottomWidth: 1,
 *   borderBottomColor: '#f0f0f0',
 * },
 * quickFiltersLabel: {
 *   fontSize: 12,
 *   fontWeight: '600',
 *   marginBottom: 8,
 * },
 * quickFiltersButtons: {
 *   flexDirection: 'row',
 *   gap: 8,
 * },
 * quickFilterButton: {
 *   paddingHorizontal: 12,
 *   paddingVertical: 6,
 *   borderRadius: 16,
 *   backgroundColor: '#f0f0f0',
 * },
 * quickFilterButtonText: {
 *   fontSize: 12,
 *   color: '#666',
 * },
 */
