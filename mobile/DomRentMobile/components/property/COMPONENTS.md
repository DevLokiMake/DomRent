// Быстрая справка по компонентам Property

import { PropertyImageCarousel, PropertyHeader, PropertyOwnerInfo, BookingForm, BookingFormAction } from '@/components/property';

// ============================================
// 1️⃣ PropertyImageCarousel
// ============================================
// Горизонтальный карусель изображений с навигацией
<PropertyImageCarousel
  images={['https://...', 'https://...']}
  currentIndex={0}
  onPrevImage={() => console.log('prev')}
  onNextImage={() => console.log('next')}
  onDotPress={(index) => console.log('dot:', index)}
/>

// ============================================
// 2️⃣ PropertyHeader
// ============================================
// Заголовок с ценой, названием, типом, избранным
<PropertyHeader
  title="Квартира в центре"
  city="Алматы"
  type="квартира"
  price={50000}
  isFavorited={false}
  onToggleFavorite={() => console.log('toggle favorite')}
/>

// ============================================
// 3️⃣ PropertyOwnerInfo
// ============================================
// Описание и карточка владельца
<PropertyOwnerInfo
  description="Очень красивая квартира..."
  owner={{
    id: 1,
    name: "Иван Иванов",
    email: "ivan@example.com",
    phone: "+7-777-777-77-77",
  }}
/>

// ============================================
// 4️⃣ BookingForm
// ============================================
// Форма выбора дат и расчета цены
<BookingForm
  startDate="2024-06-01"
  endDate="2024-06-05"
  totalNights={4}
  totalPrice={200000}
  onStartDateChange={(date) => console.log('start:', date)}
  onEndDateChange={(date) => console.log('end:', date)}
  onBooking={() => console.log('booking')}
  isLoading={false}
/>

// ============================================
// 5️⃣ BookingFormAction (Button)
// ============================================
// Кнопка "Забронировать" внизу экрана
<BookingFormAction
  totalNights={4}
  totalPrice={200000}
  onBooking={() => console.log('booking')}
  isLoading={false}
/>

// ============================================
// Полный пример использования:
// ============================================

export default function PropertyDetailScreen() {
  const {
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
  } = usePropertyDetails();

  if (isLoading) return <ActivityIndicator />;
  if (error || !property) return <ErrorView />;

  return (
    <ScrollView>
      <PropertyImageCarousel
        images={property.images || []}
        currentIndex={currentImageIndex}
        onPrevImage={() => setCurrentImageIndex(currentImageIndex - 1)}
        onNextImage={() => setCurrentImageIndex(currentImageIndex + 1)}
        onDotPress={setCurrentImageIndex}
      />

      <PropertyHeader
        title={property.title}
        city={property.city}
        type={property.type}
        price={property.price}
        isFavorited={isFavorited}
        onToggleFavorite={handleToggleFavorite}
      />

      <PropertyOwnerInfo
        description={property.description}
        owner={property.owner}
      />

      <BookingForm
        startDate={startDate}
        endDate={endDate}
        totalNights={totalNights}
        totalPrice={totalPrice}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onBooking={handleBooking}
      />

      <BookingFormAction
        totalNights={totalNights}
        totalPrice={totalPrice}
        onBooking={handleBooking}
      />
    </ScrollView>
  );
}
