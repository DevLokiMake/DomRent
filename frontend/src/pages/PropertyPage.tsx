import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Loader, AlertCircle, ArrowLeft, Heart, Star } from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { PropertyWithOwner, Booking } from "../types";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const PropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Основные состояния
  const [property, setProperty] = useState<PropertyWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для галереи
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Состояния для избранного
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);

  // Состояния для бронирования
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Состояния для текущих бронирований (для владельца)
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Отзывы
  interface Review { id: number; rating: number; text: string; createdAt: string; author: { name: string | null; email: string } }
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  // Загрузка свойства
  useEffect(() => {
    let ignore = false;

    async function fetchProperty() {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(`/properties/${id}`);
        if (!ignore) {
          setProperty(res.data.property ?? res.data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message =
            err instanceof Error ? err.message : "Не удалось загрузить объект";
          setError(message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchProperty();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  // Проверка избранного статуса
  useEffect(() => {
    let ignore = false;

    async function checkFavoriteStatus() {
      if (!user || !id) return;

      try {
        setCheckingFavorite(true);
        const res = await axiosInstance.get(`/favorites/check/${id}`);
        if (!ignore) {
          setIsFavorited(res.data?.isFavorited || false);
        }
      } catch (err) {
        console.error("Failed to check favorite status:", err);
      } finally {
        if (!ignore) {
          setCheckingFavorite(false);
        }
      }
    }

    checkFavoriteStatus();

    return () => {
      ignore = true;
    };
  }, [user, id]);

  // Загрузка текущих бронирований (для владельца)
  useEffect(() => {
    let ignore = false;

    async function fetchBookings() {
      if (!property || user?.id !== property.ownerId) return;

      try {
        setBookingsLoading(true);
        const res = await axiosInstance.get(`/properties/${id}`);
        if (!ignore) {
          const bookingsData = res.data?.property?.bookings ?? res.data?.bookings ?? [];
          setBookings(bookingsData);
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        if (!ignore) {
          setBookingsLoading(false);
        }
      }
    }

    fetchBookings();

    return () => {
      ignore = true;
    };
  }, [property, user, id]);

  // Обработчик переключения избранного
  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Пожалуйста, войдите в аккаунт");
      navigate("/login");
      return;
    }

    try {
      setCheckingFavorite(true);
      const res = await axiosInstance.post(`/favorites/toggle/${id}`);
      setIsFavorited(res.data?.action === "added" || !isFavorited);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ошибка при добавлении в избранное";
      alert(message);
    } finally {
      setCheckingFavorite(false);
    }
  };

  // Обработчик бронирования
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Пожалуйста, войдите в аккаунт");
      navigate("/login");
      return;
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      setBookingError("Пожалуйста, выберите даты бронирования");
      return;
    }

    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);

    if (endDate <= startDate) {
      setBookingError("Дата выезда должна быть позже даты заезда");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      await axiosInstance.post("/bookings", {
        propertyId: parseInt(id!),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      alert("Бронирование успешно создано!");
      setBookingData({ startDate: "", endDate: "" });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ошибка при создании бронирования";
      setBookingError(message);
    } finally {
      setBookingLoading(false);
    }
  };

  // Загрузка отзывов
  useEffect(() => {
    if (!id) return;
    axiosInstance.get(`/reviews/property/${id}`).then(res => {
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.avgRating ?? null);
    }).catch(() => {});
  }, [id]);

  // Расчёт количества дней и итоговой цены
  const calculateDaysAndPrice = () => {
    if (!bookingData.startDate || !bookingData.endDate || !property || !property.price) {
      return { days: 0, totalPrice: 0 };
    }

    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    const days = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalPrice = days * property.price;

    return { days, totalPrice };
  };

  const { days, totalPrice } = calculateDaysAndPrice();

  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Состояние загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-medium">Загрузка объекта...</p>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error || !property) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-100 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-700 font-medium mb-4">
            {error || "Объект не найден"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === property.ownerId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header с кнопкой назад */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Галерея фотографий */}
          <div className="relative w-full h-96 bg-gray-200">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={property.images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />

                {/* Кнопки для переключения фотографий */}
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex === 0
                            ? property.images.length - 1
                            : currentImageIndex - 1
                        )
                      }
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition shadow-md"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          (currentImageIndex + 1) % property.images.length
                        )
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition shadow-md"
                    >
                      →
                    </button>

                    {/* Индикаторы изображений */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {property.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex
                              ? "bg-white w-6"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Счётчик изображений */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {currentImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                )}

                {/* Тип жилья */}
                <div className="absolute top-4 left-4 bg-white text-blue-600 px-4 py-2 rounded-full font-bold uppercase text-sm">
                  {property.type}
                </div>

                {/* Кнопка добавления в избранное */}
                {user && (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={checkingFavorite}
                    className="absolute top-4 right-20 bg-white rounded-full p-3 transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        isFavorited
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-lg">Нет фотографии</span>
              </div>
            )}
          </div>

          {/* Контент */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Основная информация */}
              <div className="lg:col-span-2">
                {/* Название и цена */}
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                    <span className="text-lg">
                      {typeof property.city === "object" && property.city !== null
                        ? (property.city as { name: string }).name
                        : property.city}
                    </span>
                  </div>
                  <div className="text-4xl font-black text-blue-600 mb-4">
                    {property.price ? property.price.toLocaleString() : "0"} <span className="text-2xl">₸/ночь</span>
                  </div>
                </div>

                {/* Описание */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    О объекте
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {property.description}
                  </p>
                </div>

                {/* Карта расположения */}
                {property.latitude != null && property.longitude != null && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-blue-500" />
                      Расположение
                    </h2>
                    <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: 300 }}>
                      <MapContainer
                        center={[property.latitude!, property.longitude!]}
                        zoom={14}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[property.latitude!, property.longitude!]}>
                          <Popup>
                            <strong>{property.title}</strong><br />
                            {typeof property.city === "object" && property.city !== null
                              ? (property.city as { name: string }).name
                              : property.city}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                )}

                {/* Отзывы */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500" />
                    Отзывы
                    {avgRating !== null && (
                      <span className="text-lg font-semibold text-gray-700">
                        · {avgRating.toFixed(1)} ({reviews.length})
                      </span>
                    )}
                  </h2>
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 text-sm">Отзывов пока нет. Станьте первым!</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(r => (
                        <div key={r.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <span className="font-semibold text-gray-800 text-sm">{r.author?.name || r.author?.email}</span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Информация о владельце */}
                {property.owner && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Владелец
                    </h3>
                    <p className="text-gray-700 font-semibold mb-1">
                      {property.owner.name || "Нет имени"}
                    </p>
                    <p className="text-gray-600">{property.owner.email}</p>
                    {property.owner.phone && (
                      <p className="text-gray-600">{property.owner.phone}</p>
                    )}
                  </div>
                )}

                {/* Текущие бронирования (для владельца) */}
                {isOwner && (
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Текущие бронирования
                    </h3>

                    {bookingsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader className="w-6 h-6 animate-spin text-green-600 mr-2" />
                        <span>Загрузка бронирований...</span>
                      </div>
                    ) : bookings && bookings.length > 0 ? (
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="bg-white rounded-lg p-4 border border-green-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  User ID: {booking.userId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(booking.startDate)} —{" "}
                                  {formatDate(booking.endDate)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {booking.totalPrice.toLocaleString()} ₸
                                </p>
                                <p className="text-sm text-gray-600">
                                  {Math.ceil(
                                    (new Date(booking.endDate).getTime() -
                                      new Date(booking.startDate).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )}{" "}
                                  ночей
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Нет активных бронирований</p>
                    )}
                  </div>
                )}
              </div>

              {/* Форма бронирования */}
              {!isOwner && (
                <div className="lg:col-span-1">
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 sticky top-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Забронировать
                    </h3>

                    <form onSubmit={handleBooking} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Дата заезда
                        </label>
                        <input
                          type="date"
                          value={bookingData.startDate}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Дата выезда
                        </label>
                        <input
                          type="date"
                          value={bookingData.endDate}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                          required
                        />
                      </div>

                      {/* Расчёт стоимости */}
                      {days > 0 && property.price && (
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600">{days} ночей</span>
                            <span className="font-semibold">
                              {(days * property.price).toLocaleString()} ₸
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="font-bold text-gray-900">Итого:</span>
                            <span className="text-lg font-bold text-blue-600">
                              {totalPrice.toLocaleString()} ₸
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Ошибка бронирования */}
                      {bookingError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">{bookingError}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                      >
                        {bookingLoading ? "Обработка..." : "Забронировать"}
                      </button>
                    </form>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                      После бронирования владелец свяжется с вами
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPage;
