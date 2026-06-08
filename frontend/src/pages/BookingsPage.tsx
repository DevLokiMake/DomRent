import { useEffect, useState } from "react";
import { Loader, AlertCircle, Trash2, Phone, Mail, MapPin, Calendar } from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Booking } from "../types";

interface BookingWithProperty extends Booking {
  property?: {
    id: number;
    title: string;
    description?: string;
    city: string | { id: number; name: string };
    price: number;
    type?: string;
    contractType?: string;
    images: string[];
  };
  user?: {
    id: number;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

const getCityName = (city?: string | { id: number; name: string }): string => {
  if (!city) return "Город";
  if (typeof city === "object") return city.name;
  return city;
};

interface OwnerBooking extends BookingWithProperty {
  user: {
    id: number;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

const BookingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"trips" | "rentals">("trips");

  // Состояния для "Мои поездки"
  const [myBookings, setMyBookings] = useState<BookingWithProperty[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(true);
  const [myBookingsError, setMyBookingsError] = useState<string | null>(null);

  // Состояния для "Управление арендой"
  const [ownerBookings, setOwnerBookings] = useState<OwnerBooking[]>([]);
  const [ownerBookingsLoading, setOwnerBookingsLoading] = useState(true);
  const [ownerBookingsError, setOwnerBookingsError] = useState<string | null>(null);

  // Состояние для отмены бронирования
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // Загрузка "Мои поездки"
  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        setMyBookingsLoading(true);
        setMyBookingsError(null);
        const res = await axiosInstance.get("/bookings/my");
        setMyBookings(res.data.bookings || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Не удалось загрузить поездки";
        setMyBookingsError(message);
      } finally {
        setMyBookingsLoading(false);
      }
    };

    fetchMyBookings();
  }, []);

  // Загрузка "Управление арендой" (только если пользователь - арендодатель)
  useEffect(() => {
    if (user?.role !== "LANDLORD") return;

    const fetchOwnerBookings = async () => {
      try {
        setOwnerBookingsLoading(true);
        setOwnerBookingsError(null);
        const res = await axiosInstance.get("/bookings/owner");
        setOwnerBookings(res.data.bookings || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Не удалось загрузить бронирования";
        setOwnerBookingsError(message);
      } finally {
        setOwnerBookingsLoading(false);
      }
    };

    fetchOwnerBookings();
  }, [user?.role]);

  // Обработчик отмены бронирования
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm("Вы уверены, что хотите отменить бронирование?")) {
      return;
    }

    try {
      setCancelingId(bookingId);
      await axiosInstance.delete(`/bookings/${bookingId}`);
      setMyBookings(myBookings.filter(b => b.id !== bookingId));
      alert("Бронирование успешно отменено");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ошибка при отмене бронирования";
      alert(message);
    } finally {
      setCancelingId(null);
    }
  };

  // Определение статуса бронирования
  const getBookingStatus = (startDate: string): "active" | "completed" | "upcoming" => {
    const start = new Date(startDate);
    const now = new Date();

    if (start > now) {
      return "upcoming";
    }
    return "active";
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Расчёт количества ночей
  const calculateNights = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Проверка возможности отмены
  const canCancel = (startDate: string): boolean => {
    const start = new Date(startDate);
    const now = new Date();
    return start > now;
  };

  // Компонент карточки поездки
  const TripCard = ({ booking }: { booking: BookingWithProperty }) => {
    const status = getBookingStatus(booking.startDate);
    const nights = calculateNights(booking.startDate, booking.endDate);
    const canCancelBooking = canCancel(booking.startDate);

    const statusLabels = {
      upcoming: { label: "Предстоящая", color: "bg-blue-100 text-blue-700" },
      active: { label: "Активная", color: "bg-green-100 text-green-700" },
      completed: { label: "Завершена", color: "bg-gray-100 text-gray-700" },
    };

    const statusInfo = statusLabels[status];

    return (
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100">
        {/* Изображение */}
        <div className="relative w-full h-48 bg-gray-200">
          {booking.property?.images && booking.property.images.length > 0 ? (
            <img
              src={booking.property.images[0]}
              alt={booking.property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">Нет фотографии</span>
            </div>
          )}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </div>
        </div>

        {/* Информация */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-xl font-bold text-gray-900">
              {booking.property?.title || "Объект"}
            </h3>
            {booking.property?.type && (
              <span className="ml-2 flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full uppercase">
                {booking.property.type}
              </span>
            )}
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span className="text-sm">{getCityName(booking.property?.city)}</span>
          </div>

          {booking.property?.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {booking.property.description}
            </p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm font-medium">
                {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{nights}</span> ночей ·{" "}
              <span className="font-semibold text-gray-900">
                {booking.property?.price?.toLocaleString()} ₸
              </span>{" "}
              / ночь
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Итого:</span>
              <span className="text-xl font-bold text-blue-600">
                {booking.totalPrice.toLocaleString()} ₸
              </span>
            </div>
          </div>

          {canCancelBooking && (
            <button
              onClick={() => handleCancelBooking(booking.id)}
              disabled={cancelingId === booking.id}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelingId === booking.id ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Отмена...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Отменить бронирование
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Компонент карточки бронирования для владельца
  const RentalCard = ({ booking }: { booking: OwnerBooking }) => {
    const nights = calculateNights(booking.startDate, booking.endDate);

    return (
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100">
        {/* Изображение */}
        <div className="relative w-full h-40 bg-gray-200">
          {booking.property?.images && booking.property.images.length > 0 ? (
            <img
              src={booking.property.images[0]}
              alt={booking.property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">Нет фотографии</span>
            </div>
          )}
        </div>

        {/* Информация об объекте */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-bold text-gray-900">
              {booking.property?.title || "Объект"}
            </h3>
            {booking.property?.type && (
              <span className="ml-2 flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full uppercase">
                {booking.property.type}
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span className="text-sm">{getCityName(booking.property?.city)}</span>
          </div>
          {booking.property?.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {booking.property.description}
            </p>
          )}

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Заработок ({nights} ночей):</span>
              <span className="text-xl font-bold text-green-600">
                {booking.totalPrice.toLocaleString()} ₸
              </span>
            </div>
          </div>
        </div>

        {/* Информация о клиенте */}
        <div className="p-5">
          <h4 className="font-semibold text-gray-900 mb-3">Данные клиента:</h4>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Имя:</p>
              <p className="font-medium text-gray-900">
                {booking.user?.name || "Не указано"}
              </p>
            </div>

            {booking.user?.email && (
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${booking.user.email}`}
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {booking.user.email}
                </a>
              </div>
            )}

            {booking.user?.phone && (
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <a
                  href={`tel:${booking.user.phone}`}
                  className="text-green-600 hover:underline text-sm"
                >
                  {booking.user.phone}
                </a>
              </div>
            )}

            <div className="pt-2">
              <p className="text-sm text-gray-600 mb-1">Даты бронирования:</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент пустого состояния
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет бронирований</h3>
      <p className="text-gray-600 text-center max-w-xs">{message}</p>
    </div>
  );

  // Компонент состояния ошибки
  const ErrorState = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3">
      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
      <div>
        <h3 className="font-semibold text-red-900 mb-1">Ошибка загрузки</h3>
        <p className="text-red-700 text-sm">{message}</p>
      </div>
    </div>
  );

  // Компонент состояния загрузки
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 font-medium">Загрузка бронирований...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои бронирования</h1>
          <p className="text-gray-600">Управляйте вашими поездками и арендой</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 bg-white rounded-2xl p-2 shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab("trips")}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
              activeTab === "trips"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Мои поездки
          </button>
          {user?.role === "LANDLORD" && (
            <button
              onClick={() => setActiveTab("rentals")}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
                activeTab === "rentals"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Управление арендой
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === "trips" && (
          <div>
            {myBookingsLoading ? (
              <LoadingState />
            ) : myBookingsError ? (
              <ErrorState message={myBookingsError} />
            ) : myBookings.length === 0 ? (
              <EmptyState message="Вы еще не забронировали никакого жилья. Начните искать интересные объекты!" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBookings.map(booking => (
                  <TripCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "rentals" && (
          <div>
            {ownerBookingsLoading ? (
              <LoadingState />
            ) : ownerBookingsError ? (
              <ErrorState message={ownerBookingsError} />
            ) : ownerBookings.length === 0 ? (
              <EmptyState message="У вас еще нет бронирований на ваше жилье. Добавьте объект и ждите первых бронирований!" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ownerBookings.map(booking => (
                  <RentalCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
