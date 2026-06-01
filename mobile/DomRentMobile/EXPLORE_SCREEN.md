# Экран поиска недвижимости (Explore Screen)

## 📱 Описание

Экран `app/(tabs)/explore.tsx` - это главный экран для поиска и фильтрации объектов недвижимости в мобильном приложении DomRent на Expo.

## ✨ Особенности

### 1. **FlatList для плавного скролла**
- Оптимизированный для мобильных устройств
- Рендеринг только видимых карточек (виртуализация)
- Поддержка пусть состояния

### 2. **Карточки объектов**
- Первое изображение из массива `images`
- Название объекта (до 2 строк)
- Город с иконкой 📍
- Тип жилья (квартира, дом, комната)
- Краткое описание (до 2 строк)
- Цена в красивом формате: `15 000 ₸ / ночь`

### 3. **Модальное окно фильтров**
- Фильтр по городу (TextInput)
- Фильтр по типу жилья (кнопки)
- Фильтр по цене (от/до)
- Кнопки "Применить" и "Сбросить"
- Значок с количеством активных фильтров

### 4. **API интеграция**
- Автоматический запрос `/properties` при загрузке
- Отправка query-параметров: `?city=...&type=...&minPrice=...&maxPrice=...`
- Обработка ошибок с возможностью повторной попытки

### 5. **Состояния UX**
- 🔄 Загрузка (ActivityIndicator)
- ✅ Успешная загрузка с карточками
- ❌ Ошибка с кнопкой "Попробовать снова"
- 📭 Пусто (объектов не найдено)

## 🚀 Использование

### Навигация на детали объекта

При нажатии на карточку срабатывает:
```typescript
router.push(`/property/${item.id}`);
```

Это перенаправляет на экран `app/property/[id].tsx`, где отображаются полные детали объекта.

### Запрос данных

При загрузке и после применения фильтров:
```typescript
GET /properties
// или с фильтрами:
GET /properties?city=Алматы&type=квартира&minPrice=10000&maxPrice=50000
```

## 📐 Компоненты

### Основные компоненты React Native

- `<FlatList />` - список объектов с виртуализацией
- `<Modal />` - модальное окно фильтров
- `<TextInput />` - поля для ввода текста
- `<TouchableOpacity />` - интерактивные кнопки
- `<Image />` - отображение картинок
- `<ActivityIndicator />` - индикатор загрузки
- `<ScrollView />` - скролл в модали

### Кастомные компоненты

- `<ThemedView />` - контейнер с темой
- `<ThemedText />` - текст с темой

### Иконки

- `Search` - иконка поиска (в пусто состояние)
- `Filter` - иконка фильтров (кнопка)
- `X` - закрыть модаль
- Эмодзи: 📍, 🏢, 🏡, 🛏️, ❌

## 🔧 Кастомизация

### Изменить количество столбцов

Текущие стили расчитаны на 1 колонку. Для 2-3 колонок отредактируйте:

```typescript
// В renderPropertyCard:
const COLUMNS = 2; // вместо 1
const CARD_WIDTH = (width - 32 - 8) / COLUMNS; // 8 - gap между карточками
```

### Изменить размер карточки

```typescript
cardImage: {
  width: CARD_WIDTH,
  height: 250, // вместо 200
}
```

### Добавить фильтр по рейтингу

```typescript
// В FilterState добавить:
minRating: number;

// В UI добавить:
<View style={styles.filterGroup}>
  <ThemedText style={styles.filterLabel}>Минимальный рейтинг</ThemedText>
  <Slider />
</View>
```

## 🐛 Решение проблем

### Ошибка: "Cannot read property 'images' of undefined"

Убедитесь, что на бэкенде возвращается правильный формат:
```json
{
  "properties": [
    {
      "id": 1,
      "title": "...",
      "images": ["url1", "url2"],
      ...
    }
  ]
}
```

### FlatList не скролится

Убедитесь, что:
- Container имеет `flex: 1`
- FlatList имеет `scrollEnabled={true}`
- Данные загружены и есть хотя бы 1 элемент

### Фильтры не применяются

Проверьте:
- API endpoint отвечает на query-параметры
- Query параметры правильно построены в `fetchProperties`
- Названия параметров совпадают с бэкенда (`city`, `type`, `minPrice`, `maxPrice`)

### Изображения не загружаются

Проверьте:
- URL изображения доступен (используйте валидный HTTPS или HTTP)
- Image компонент из `expo-image` импортирован правильно
- Fallback изображение работает для placeholder

## 📊 Структура данных

### Property

```typescript
{
  id: number;
  title: string;
  description: string;
  price: number;           // цена за ночь
  city: string;
  type: string;            // "квартира" | "дом" | "комната"
  images: string[];        // массив URL
  ownerId: number;
  owner?: PropertyOwner;
}
```

### FilterState

```typescript
{
  city: string;                                     // пусто = все города
  type: 'все' | 'квартира' | 'дом' | 'комната';
  minPrice: string;                                 // пусто = нет ограничения
  maxPrice: string;                                 // пусто = нет ограничения
}
```

## 🎨 Стили

Все стили определены в `StyleSheet.create()` в конце файла:

- **Цвет основной**: `#007AFF` (iOS синий)
- **Цвет ошибки**: `#FF3B30` (iOS красный)
- **Фон**: `#fff` (белый)
- **Текст вторичный**: `#666`, `#999` (серые оттенки)

## 📚 Примеры интеграции

### Использование с Auth Context

```typescript
const { isAuthenticated } = useAuth();

// После выхода из аккаунта:
useEffect(() => {
  if (!isAuthenticated) {
    router.replace('/login');
  }
}, [isAuthenticated]);
```

### Сохранение последних фильтров

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Сохранить при применении
await AsyncStorage.setItem('lastFilters', JSON.stringify(filters));

// Загрузить при инициализации
const savedFilters = await AsyncStorage.getItem('lastFilters');
if (savedFilters) {
  setActiveFilters(JSON.parse(savedFilters));
}
```

### Добавить избранное

```typescript
const handleAddFavorite = async (propertyId: number) => {
  try {
    await axiosInstance.post(`/favorites/toggle/${propertyId}`);
    // Обновить UI
  } catch (error) {
    Alert.alert('Ошибка', 'Не удалось добавить в избранное');
  }
};
```

## ✅ Чек-лист перед запуском

- [ ] API endpoint `/properties` работает
- [ ] Query параметры поддерживаются на бэкенде
- [ ] IP адрес в `api/axios.ts` правильный (для iOS)
- [ ] Изображения загружаются с корректными URL
- [ ] FlatList скролится плавно
- [ ] Фильтры открываются/закрываются
- [ ] Кнопка "Применить" отправляет запрос
- [ ] Ошибка обрабатывается корректно

## 🔗 Связанные файлы

- `api/axios.ts` - HTTP клиент
- `context/AuthContext.tsx` - авторизация
- `app/property/[id].tsx` - экран деталей
- `types/index.ts` - TypeScript типы
- `components/themed-view.tsx` - компонент контейнера
- `components/themed-text.tsx` - компонент текста
