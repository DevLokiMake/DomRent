import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader, AlertCircle, Trash2, Phone, Mail,
  MapPin, Calendar, MessageSquare, Star
} from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Booking } from "../types";

type BookingStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

interface BookingWithProperty extends Booking {
  status: BookingStatus;
  property?: {
    id: number;
    title: string;
    description?: string;
    city: string | { id: number; name: string };
    price: number;
    type?: string;
    contractType?: string;
    images: string[];
    coverImage?: string | null;
  };
  user?: {
    id: number;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface OwnerBooking extends BookingWithProperty {
  user: {
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

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  UPCOMING:  { label: "Предстоящая", color: "text-blue-700",  bg: "bg-blue-100" },
  ACTIVE:    { label: "Активная",    color: "text-green-700", bg: "bg-green-100" },
  COMPLETED: { label: "Завершена",   color: "text-gray-700",  bg: "bg-gray-100" },
  CANCELLED: { label: "Отменена",    color: "text-red-700",   bg: "bg-red-100" },
};

const STATUS_FILTERS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL",       label: "Все" },
  { value: "UPCOMING",  label: "Предстоящие" },
  { value: "ACTIVE",    label: "Активные" },
  { value: "COMPLETED", label: "Завершённые" },
  { value: "CANCELLED", label: "Отменённые" },
];

const BookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"trips" | "rentals">("trips");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");

  const [myBookings, setMyBookings] = useState<BookingWithProperty[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(true);
  const [myBookingsError, setMyBookingsError] = useState<string | null>(null);

  const [ownerBookings, setOwnerBookings] = useState<OwnerBooking[]>([]);
  const [ownerBookingsLoading, setOwnerBookingsLoading] = useState(true);
  const [ownerBookingsError, setOwnerBookingsError] = useState<string | null>(null);

  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // ─── Отзыв ───────────────────────────────────────────────────────────────
  const [reviewModal, setReviewModal] = useState<{ bookingId: number; propertyTitle: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<number>>(new Set());

  useEffect(() => {
    axiosInstance.get("/bookings/my").then(res => {
      setMyBookings(res.data.bookings || []);
    }).catch(err => {
      setMyBookingsError(err.response?.data?.error || "Не удалось загрузить поездки");
    }).finally(() => setMyBookingsLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "LANDLORD") { setOwnerBookingsLoading(false); return; }
    axiosInstance.get("/bookings/owner").then(res => {
      setOwnerBookings(res.data.bookings || []);
    }).catch(err => {
      setOwnerBookingsError(err.response?.data?.error || "Не удалось загрузить бронирования");
    }).finally(() => setOwnerBookingsLoading(false));
  }, [user?.role]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm("Вы уверены, что хотите отменить бронирование?")) return;
    try {
      setCancelingId(bookingId);
      await axiosInstance.delete(`/bookings/${bookingId}`);
      setMyBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: "CANCELLED" } : b)
      );
    } catch (err: unknown) {
      alert((err as any).response?.data?.error || "Ошибка при отмене");
    } finally {
      setCancelingId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal) return;
    if (!reviewText.trim()) { alert("Напишите текст отзыва"); return; }
    try {
      setReviewLoading(true);
      await axiosInstance.post("/reviews", {
        bookingId: reviewModal.bookingId,
        rating: reviewRating,
        text: reviewText.trim(),
      });
      setReviewedBookings(prev => new Set([...prev, reviewModal.bookingId]));
      setReviewModal(null);
      setReviewText("");
      setReviewRating(5);
      alert("Отзыв успешно отправлен!");
    } catch (err: unknown) {
      alert((err as any).response?.data?.error || "Ошибка при отправке отзыва");
    } finally {
      setReviewLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { year: "numeric", month: "short", day: "numeric" });

  const calcNights = (s: string, e: string) =>
    Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000);

  const filteredMyBookings = statusFilter === "ALL"
    ? myBookings
    : myBookings.filter(b => b.status === statusFilter);

  const filteredOwnerBookings = statusFilter === "ALL"
    ? ownerBookings
    : ownerBookings.filter(b => b.status === statusFilter);

  // ─── Компоненты ──────────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: BookingStatus }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UPCOMING;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  const TripCard = ({ booking }: { booking: BookingWithProperty }) => {
    const nights = calcNights(booking.startDate, booking.endDate);
    const coverImg = booking.property?.coverImage || booking.property?.images?.[0];
    const canCancel = booking.status === "UPCOMING" || booking.status === "ACTIVE";
    const canReview = booking.status === "COMPLETED" && !reviewedBookings.has(booking.id);

    return (
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100">
        <div className="relative w-full h-48 bg-gray-200">
          {coverImg ? (
            <img src={coverImg} alt={booking.property?.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Нет фото</div>
          )}
          <div className="absolute top-3 right-3">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-xl font-bold text-gray-900">{booking.property?.title || "Объект"}</h3>
            {booking.property?.type && (
              <span className="ml-2 flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full uppercase">
                {booking.property.type}
              </span>
            )}
          </div>

          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span className="text-sm">{getCityName(booking.property?.city)}</span>
          </div>

          <div className="flex items-center text-gray-700 mb-1">
            <Calendar className="w-4 h-4 mr-2 text-orange-500" />
            <span className="text-sm font-medium">
              {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            <span className="font-semibold text-gray-900">{nights}</span> ночей
            {booking.property?.price && (
              <> · <span className="font-semibold text-gray-900">
                {booking.property.price.toLocaleString()} ₸
              </span> / ночь</>
            )}
          </p>

          <div className="bg-blue-50 rounded-lg p-3 mb-4 flex justify-between items-center">
            <span className="text-gray-700 text-sm">Итого:</span>
            <span className="text-xl font-bold text-blue-600">
              {booking.totalPrice.toLocaleString()} ₸
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Чат */}
            <button
              onClick={() => navigate(`/chat/${booking.id}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              <MessageSquare className="w-4 h-4" />
              Чат
            </button>

            {/* Отзыв */}
            {canReview && (
              <button
                onClick={() => setReviewModal({ bookingId: booking.id, propertyTitle: booking.property?.title || "" })}
                className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg transition"
              >
                <Star className="w-4 h-4" />
                Оставить отзыв
              </button>
            )}

            {/* Отмена */}
            {canCancel && (
              <button
                onClick={() => handleCancelBooking(booking.id)}
                disabled={cancelingId === booking.id}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition disabled:opacity-50 ml-auto"
              >
                {cancelingId === booking.id ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Отменить
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RentalCard = ({ booking }: { booking: OwnerBooking }) => {
    const nights = calcNights(booking.startDate, booking.endDate);
    const coverImg = booking.property?.coverImage || booking.property?.images?.[0];

    return (
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100">
        <div className="relative w-full h-40 bg-gray-200">
          {coverImg ? (
            <img src={coverImg} alt={booking.property?.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Нет фото</div>
          )}
          <div className="absolute top-3 right-3">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-bold text-gray-900">{booking.property?.title || "Объект"}</h3>
            {booking.property?.type && (
              <span className="ml-2 flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full uppercase">
                {booking.property.type}
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span className="text-sm">{getCityName(booking.property?.city)}</span>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Заработок ({nights} ночей):</span>
              <span className="text-xl font-bold text-green-600">
                {booking.totalPrice.toLocaleString()} ₸
              </span>
            </div>
          </div>
        </div>

        <div className="p-5">
          <h4 className="font-semibold text-gray-900 mb-3">Клиент:</h4>
          <div className="space-y-2 mb-4">
            <p className="font-medium text-gray-900">{booking.user?.name || "Не указано"}</p>
            {booking.user?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <a href={`mailto:${booking.user.email}`} className="text-blue-600 hover:underline text-sm">
                  {booking.user.email}
                </a>
              </div>
            )}
            {booking.user?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                <a href={`tel:${booking.user.phone}`} className="text-green-600 hover:underline text-sm">
                  {booking.user.phone}
                </a>
              </div>
            )}
            <p className="text-sm text-gray-600">
              <Calendar className="w-3 h-3 inline mr-1" />
              {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
            </p>
          </div>
          <button
            onClick={() => navigate(`/chat/${booking.id}`)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition"
          >
            <MessageSquare className="w-4 h-4" />
            Написать клиенту
          </button>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет бронирований</h3>
      <p className="text-gray-600 text-center max-w-xs">{message}</p>
    </div>
  );

  const ErrorState = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3">
      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
      <div>
        <h3 className="font-semibold text-red-900 mb-1">Ошибка загрузки</h3>
        <p className="text-red-700 text-sm">{message}</p>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 font-medium">Загрузка бронирований...</p>
    </div>
  );

  // ─── Рендер ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои бронирования</h1>
          <p className="text-gray-600">Управляйте вашими поездками и арендой</p>
        </div>

        {/* Табы */}
        <div className="flex gap-4 mb-6 bg-white rounded-2xl p-2 shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab("trips")}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
              activeTab === "trips" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Мои поездки
          </button>
          {user?.role === "LANDLORD" && (
            <button
              onClick={() => setActiveTab("rentals")}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
                activeTab === "rentals" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Управление арендой
            </button>
          )}
        </div>

        {/* Фильтр по статусу */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                statusFilter === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {f.label}
              {f.value !== "ALL" && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({(activeTab === "trips" ? myBookings : ownerBookings)
                    .filter(b => b.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Контент */}
        {activeTab === "trips" && (
          myBookingsLoading ? <LoadingState /> :
          myBookingsError ? <ErrorState message={myBookingsError} /> :
          filteredMyBookings.length === 0 ? (
            <EmptyState message={
              statusFilter === "ALL"
                ? "Вы ещё не бронировали жильё. Начните поиск!"
                : `Нет бронирований со статусом «${STATUS_CONFIG[statusFilter as BookingStatus]?.label}»`
            } />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyBookings.map(b => <TripCard key={b.id} booking={b} />)}
            </div>
          )
        )}

        {activeTab === "rentals" && (
          ownerBookingsLoading ? <LoadingState /> :
          ownerBookingsError ? <ErrorState message={ownerBookingsError} /> :
          filteredOwnerBookings.length === 0 ? (
            <EmptyState message={
              statusFilter === "ALL"
                ? "У вас нет бронирований на ваше жильё."
                : `Нет бронирований со статусом «${STATUS_CONFIG[statusFilter as BookingStatus]?.label}»`
            } />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOwnerBookings.map(b => <RentalCard key={b.id} booking={b as OwnerBooking} />)}
            </div>
          )
        )}
      </div>

      {/* Модал: оставить отзыв */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Оставить отзыв</h2>
            <p className="text-gray-500 text-sm mb-5">«{reviewModal.propertyTitle}»</p>

            {/* Звёзды */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="transition"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-lg font-semibold text-gray-700 self-center">
                {reviewRating} / 5
              </span>
            </div>

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Расскажите о своём опыте проживания..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setReviewModal(null); setReviewText(""); setReviewRating(5); }}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50"
              >
                {reviewLoading ? "Отправка..." : "Отправить отзыв"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
