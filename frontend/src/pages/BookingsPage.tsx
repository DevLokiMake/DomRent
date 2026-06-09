import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader, AlertCircle, Trash2, Phone, Mail,
  MapPin, Calendar, MessageSquare, Star, Home
} from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";
type BookingStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

interface BookingWithProperty {
  id: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  userId: number;
  propertyId: number;
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

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; dot: string }> = {
  UPCOMING:  { label: "Предстоящая", color: "text-blue-700",  bg: "bg-blue-50 border-blue-200",   dot: "bg-blue-500" },
  ACTIVE:    { label: "Активная",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  COMPLETED: { label: "Завершена",   color: "text-gray-600",  bg: "bg-gray-100 border-gray-200",   dot: "bg-gray-400" },
  CANCELLED: { label: "Отменена",    color: "text-red-700",   bg: "bg-red-50 border-red-200",     dot: "bg-red-500" },
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

  // ─── Sub-components ──────────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: BookingStatus }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UPCOMING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
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
      <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 dark:border-gray-800">
        {/* Photo */}
        <div className="relative h-52 bg-gray-100">
          {coverImg ? (
            <img src={coverImg} alt={booking.property?.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
              <Home className="w-10 h-10" />
              <span className="text-sm">Нет фото</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-4 left-4">
            <StatusBadge status={booking.status} />
          </div>
          {booking.property?.type && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
                {booking.property.type}
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 leading-snug">{booking.property?.title || "Объект"}</h3>

          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4 gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-sm">{getCityName(booking.property?.city)}</span>
          </div>

          {/* Dates row */}
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">{formatDate(booking.startDate)}</span>
            <span className="text-gray-400">—</span>
            <span className="font-medium">{formatDate(booking.endDate)}</span>
            <span className="ml-auto text-gray-500 text-xs">{nights} н.</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Итого оплачено</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{booking.totalPrice.toLocaleString()} ₸</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/chat/${booking.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition"
            >
              <MessageSquare className="w-4 h-4" />
              Чат
            </button>

            {canReview && (
              <button
                onClick={() => setReviewModal({ bookingId: booking.id, propertyTitle: booking.property?.title || "" })}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-xl transition border border-amber-200"
              >
                <Star className="w-4 h-4" />
                Отзыв
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => handleCancelBooking(booking.id)}
                disabled={cancelingId === booking.id}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition border border-red-200 ml-auto disabled:opacity-50"
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
      <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 dark:border-gray-800">
        <div className="flex gap-0">
          {/* Left: photo */}
          <div className="w-36 flex-shrink-0 relative bg-gray-100">
            {coverImg ? (
              <img src={coverImg} alt={booking.property?.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Home className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Right: info */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{booking.property?.title || "Объект"}</h3>
              <StatusBadge status={booking.status} />
            </div>

            <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
              <MapPin className="w-3 h-3" />
              <span>{getCityName(booking.property?.city)}</span>
            </div>

            {/* Dates */}
            <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              {formatDate(booking.startDate)} — {formatDate(booking.endDate)} · {nights} н.
            </div>

            {/* Tenant */}
            <div className="border-t border-gray-100 pt-3 mt-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-700">{booking.user?.name || "Гость"}</p>
              {booking.user?.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <a href={`mailto:${booking.user.email}`} className="text-xs text-blue-600 hover:underline truncate">{booking.user.email}</a>
                </div>
              )}
              {booking.user?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <a href={`tel:${booking.user.phone}`} className="text-xs text-emerald-600 hover:underline">{booking.user.phone}</a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Доход</p>
                <p className="text-base font-black text-emerald-600">{booking.totalPrice.toLocaleString()} ₸</p>
              </div>
              <button
                onClick={() => navigate(`/chat/${booking.id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Чат
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
        <Calendar className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Нет бронирований</h3>
      <p className="text-gray-500 max-w-xs text-sm">{message}</p>
    </div>
  );

  const ErrorState = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-900 text-sm mb-0.5">Ошибка загрузки</p>
        <p className="text-red-700 text-sm">{message}</p>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader className="w-8 h-8 animate-spin text-gray-400 mb-3" />
      <p className="text-gray-500 text-sm font-medium">Загрузка...</p>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Бронирования</h1>
          <p className="text-gray-500 dark:text-gray-400">Управляйте поездками и арендой</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-900 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-800 w-fit">
          <button
            onClick={() => setActiveTab("trips")}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === "trips" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Мои поездки
            {myBookings.length > 0 && (
              <span className={`ml-2 text-xs ${activeTab === "trips" ? "text-gray-300" : "text-gray-400"}`}>
                {myBookings.length}
              </span>
            )}
          </button>
          {user?.role === "LANDLORD" && (
            <button
              onClick={() => setActiveTab("rentals")}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "rentals" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Управление арендой
              {ownerBookings.length > 0 && (
                <span className={`ml-2 text-xs ${activeTab === "rentals" ? "text-gray-300" : "text-gray-400"}`}>
                  {ownerBookings.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_FILTERS.map(f => {
            const count = f.value !== "ALL"
              ? (activeTab === "trips" ? myBookings : ownerBookings).filter(b => b.status === f.value).length
              : null;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  statusFilter === f.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                {f.label}
                {count !== null && count > 0 && (
                  <span className={`text-xs font-bold ${statusFilter === f.value ? "text-gray-300" : "text-gray-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOwnerBookings.map(b => <RentalCard key={b.id} booking={b as OwnerBooking} />)}
            </div>
          )
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-modal animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Оставить отзыв</h2>
            <p className="text-gray-400 text-sm mb-5">«{reviewModal.propertyTitle}»</p>

            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                  <Star className={`w-9 h-9 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                </button>
              ))}
              <span className="ml-2 text-base font-bold text-gray-700 self-center">{reviewRating}/5</span>
            </div>

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Расскажите о своём опыте проживания..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none resize-none mb-4 text-sm transition-all"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setReviewModal(null); setReviewText(""); setReviewRating(5); }}
                className="flex-1 py-3 border border-gray-200 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 transition text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewLoading}
                className="flex-1 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl font-bold transition disabled:opacity-50 text-sm"
              >
                {reviewLoading ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
