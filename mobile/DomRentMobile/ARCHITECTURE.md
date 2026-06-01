# 🏗️ Рефакторинг экрана PropertyDetail - Чистая архитектура

## 📋 Структура проекта после рефакторинга

```
DomRentMobile/
├── app/
│   └── property/
│       └── [id].tsx (60 строк - главный экран)
│
├── hooks/
│   └── usePropertyDetails.ts (150+ строк - вся бизнес-логика)
│
└── components/
    └── property/
        ├── PropertyImageCarousel.tsx (120 строк)
        ├── PropertyHeader.tsx (130 строк)
        ├── PropertyOwnerInfo.tsx (90 строк)
        └── BookingForm.tsx (160 строк)
```

## 🎯 Принципы разделения ответственности

### 1. **hooks/usePropertyDetails.ts** — Бизнес-логика
- ✅ Все запросы к API (axios)
- ✅ Состояние: property, loading, error, isFavorited
- ✅ Логика расчётов: totalNights, totalPrice
- ✅ Функции: handleToggleFavorite, handleBooking
- ✅ Управление датами: startDate, endDate
- ✅ Инициализация (useEffect, useLocalSearchParams)

**Не содержит:**
- ❌ Никакого UI кода
- ❌ React Native компонентов
- ❌ StyleSheet
- ❌ JSX

### 2. **components/property/** — UI компоненты
Каждый компонент отвечает за свой кусок интерфейса:

#### PropertyImageCarousel.tsx
- Горизонтальный скролл изображений
- Кнопки навигации (←/→)
- Индикаторы точек
- Счётчик изображений

#### PropertyHeader.tsx
- Название объекта
- Цена за ночь
- Город и тип жилья
- Кнопка избранного

#### PropertyOwnerInfo.tsx
- Описание объекта
- Карточка с данными владельца
- Контактная информация

#### BookingForm.tsx
- Выбор дат заезда/выезда
- Отображение расчётов
- Кнопка бронирования

### 3. **app/property/[id].tsx** — Главный экран (60 строк)
Функции:
1. Вызывает хук `usePropertyDetails()`
2. Показывает `ActivityIndicator` при загрузке
3. Показывает ошибку если что-то сломалось
4. Передаёт данные в компоненты как props
5. Слушает пропсы и управляет навигацией

**Больше ничего!**

---

## 🔄 Поток данных

```
[id].tsx
    ↓
usePropertyDetails()
    ├── fetch /properties/{id} → property
    ├── fetch /favorites/check/{id} → isFavorited
    ├── handleToggleFavorite() → POST /favorites/toggle/{id}
    └── handleBooking() → POST /bookings
    ↓
props передаются компонентам:
    ├── PropertyImageCarousel (images, currentIndex, handlers)
    ├── PropertyHeader (title, price, handlers)
    ├── PropertyOwnerInfo (description, owner)
    └── BookingForm (dates, prices, handlers)
```

---

## 📊 Пример использования

### Старый способ (не масштабируется)
```typescript
// В одном файле [id].tsx было:
// - 550 строк кода
// - 10+ useState
// - 5+ функций с бизнес-логикой
// - 8+ компонентов JSX
// - 200+ строк стилей
// ❌ Сложно тестировать
// ❌ Сложно модифицировать
// ❌ Сложно переиспользовать
```

### Новый способ (чистая архитектура)
```typescript
// 1. Хук содержит логику
const { property, totalPrice, handleBooking } = usePropertyDetails();

// 2. Компоненты чистые функции
<BookingForm totalPrice={totalPrice} onBooking={handleBooking} />

// 3. Главный файл - это оркестр
export default function PropertyDetailScreen() {
  const data = usePropertyDetails();
  return (
    <Component1 {...props1} />
    <Component2 {...props2} />
    <Component3 {...props3} />
  );
}
```

---

## 🧪 Тестирование

### Тестирование хука (изолировано от UI)
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { usePropertyDetails } from '@/hooks/usePropertyDetails';

test('should fetch property on mount', async () => {
  const { result } = renderHook(() => usePropertyDetails());
  
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  expect(result.current.property).toBeDefined();
});
```

### Тестирование компонента (изолировано от логики)
```typescript
import { render } from '@testing-library/react-native';
import { PropertyHeader } from '@/components/property/PropertyHeader';

test('should render title', () => {
  const { getByText } = render(
    <PropertyHeader
      title="Квартира"
      city="Алматы"
      type="квартира"
      price={50000}
      isFavorited={false}
      onToggleFavorite={() => {}}
    />
  );
  
  expect(getByText('Квартира')).toBeTruthy();
});
```

---

## 🔧 Добавление новой функции

### Пример: Добавить отзывы

**Шаг 1:** Расширить хук
```typescript
// hooks/usePropertyDetails.ts
const [reviews, setReviews] = useState([]);

const fetchReviews = useCallback(async () => {
  const response = await axiosInstance.get(`/properties/${id}/reviews`);
  setReviews(response.data);
}, [id]);

useEffect(() => {
  fetchReviews();
}, [fetchReviews]);

return { ..., reviews };
```

**Шаг 2:** Создать компонент
```typescript
// components/property/PropertyReviews.tsx
export function PropertyReviews({ reviews }: { reviews: Review[] }) {
  return (
    <View>
      {reviews.map(review => <ReviewCard key={review.id} {...review} />)}
    </View>
  );
}
```

**Шаг 3:** Добавить в главный файл
```typescript
// app/property/[id].tsx
const { reviews } = usePropertyDetails();
return <PropertyReviews reviews={reviews} />;
```

---

## ✅ Преимущества архитектуры

| Аспект | До | После |
|--------|----|----|
| **Размер главного файла** | 550 строк | 60 строк |
| **Количество файлов** | 1 | 6 |
| **Переиспользуемость** | ❌ | ✅ |
| **Тестируемость** | ❌ | ✅ |
| **Читаемость** | 🔴 | 🟢 |
| **Модифицируемость** | Сложно | Просто |
| **Масштабируемость** | Сложно | Просто |

---

## 🎓 Правила чистой архитектуры в React Native

### 1. **Разделение интересов**
- ✅ Логика отдельно от UI
- ✅ Каждый компонент - одна ответственность
- ❌ Не смешивать API вызовы с JSX

### 2. **Prop Drilling вместо Context для простых случаев**
- ✅ Для 1-2 уровней: props
- ✅ Для 3+ уровней: Context API или Redux

### 3. **Типизация через TypeScript**
- ✅ Интерфейсы для пропсов компонентов
- ✅ Интерфейсы для API ответов
- ✅ Интерфейсы для хуков

### 4. **Файловая структура отражает структуру данных**
```
hooks/         → логика
components/    → UI
pages/         → скрины
services/      → API
types/         → типы
```

---

## 🚀 Миграция на эту архитектуру для других экранов

### Пример для экрана BookingsPage

**Создать хук:**
```typescript
// hooks/useBookings.ts
export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBookings = async () => {
      const response = await axiosInstance.get('/bookings');
      setBookings(response.data);
    };
    fetchBookings();
  }, []);
  
  return { bookings, loading };
}
```

**Создать компоненты:**
```typescript
// components/booking/BookingCard.tsx
export function BookingCard({ booking }: { booking: Booking }) { ... }

// components/booking/BookingList.tsx
export function BookingList({ bookings }: { bookings: Booking[] }) { ... }
```

**Главный файл:**
```typescript
// app/bookings/index.tsx
export default function BookingsPage() {
  const { bookings, loading } = useBookings();
  if (loading) return <ActivityIndicator />;
  return <BookingList bookings={bookings} />;
}
```

---

## 📚 Файлы для дальнейшего изучения

- `hooks/usePropertyDetails.ts` - полная реализация хука
- `components/property/*.tsx` - примеры UI компонентов
- `app/property/[id].tsx` - главный экран после рефакторинга

---

## 🎯 Далее

1. Рефакторить другие экраны (ProfilePage, BookingsPage, etc.)
2. Добавить глобальный state management (Redux/Zustand)
3. Добавить unit и integration тесты
4. Добавить E2E тесты (Detox)
5. Подумать о мобилизации (повторное использование хуков на веб)

---

**Поздравляем! Вы восстановили чистую архитектуру! 🎉**
