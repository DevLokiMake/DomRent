import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Bell, Shield } from "lucide-react";
import HomePage from "./pages/HomePage";
import { RegisterPage } from './pages/RegisterPage';
import LoginPage from "./pages/LoginPage";
import PropertyPage from "./pages/PropertyPage";
import BookingsPage from "./pages/BookingsPage";
import FavoritesPage from "./pages/FavoritesPage";
import CreatePropertyPage from "./pages/CreatePropertyPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import axiosInstance from "./api/axios";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  entityId?: number | null;
}

const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      const list: Notification[] = res.data.notifications || [];
      setNotifications(list);
      setUnread(list.filter(n => !n.isRead).length);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Закрытие по клику снаружи
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const markOneRead = async (id: number) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleNotifClick = (n: Notification) => {
    markOneRead(n.id);
    setOpen(false);
    if (n.entityId && (n.type === "BOOKING_NEW" || n.type === "BOOKING_CONFIRMED" || n.type === "BOOKING_CANCELLED")) {
      navigate("/bookings");
    } else if (n.entityId && n.type === "MESSAGE_NEW") {
      navigate(`/chat/${n.entityId}`);
    } else if (n.entityId && n.type === "REVIEW_NEW") {
      navigate(`/property/${n.entityId}`);
    }
  };

  const TYPE_ICON: Record<string, string> = {
    BOOKING_NEW: "📅",
    BOOKING_CONFIRMED: "✅",
    BOOKING_CANCELLED: "❌",
    MESSAGE_NEW: "💬",
    REVIEW_NEW: "⭐",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        title="Уведомления"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Уведомления</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Прочитать все
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Уведомлений нет</p>
            ) : (
              notifications.slice(0, 20).map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition flex gap-3 ${n.isRead ? "" : "bg-blue-50"}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("ru-RU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Внутренний Navbar, который имеет доступ к AuthContext
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center px-10">
      <Link to="/" className="text-2xl font-bold text-blue-600">
        DomRent
      </Link>
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">
          Главная
        </Link>
        {user ? (
          <div className="flex items-center space-x-4">
            <Link to="/bookings" className="text-gray-600 hover:text-blue-600 font-medium">
              Бронирования
            </Link>
            <Link to="/favorites" className="text-gray-600 hover:text-blue-600 font-medium">
              ❤️ Избранное
            </Link>
            {user.role === 'LANDLORD' && (
              <Link to="/create-property" className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition">
                ➕ Добавить объект
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link to="/admin" className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition">
                <Shield className="w-4 h-4" />Админ
              </Link>
            )}
            <span className="text-gray-800 font-semibold">
              Привет, {user.name}!
            </span>
            <NotificationsBell />
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Выйти
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="text-blue-600 hover:underline">
              Вход
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// Главный компонент со всеми обертками
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-10 px-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/property/:id" element={<PropertyPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/create-property" element={<CreatePropertyPage />} />
              <Route path="/chat/:bookingId" element={<ChatPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}


export { RegisterPage };
export { App };
