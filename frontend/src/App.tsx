import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Bell, Shield, Home, ChevronDown, LogOut, Calendar, Heart, Plus, User, Menu, X } from "lucide-react";
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

// ─── Notifications Bell ──────────────────────────────────────────────────────
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
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

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
    if (n.entityId && ["BOOKING_NEW", "BOOKING_CONFIRMED", "BOOKING_CANCELLED"].includes(n.type)) navigate("/bookings");
    else if (n.entityId && n.type === "MESSAGE_NEW") navigate(`/chat/${n.entityId}`);
    else if (n.entityId && n.type === "REVIEW_NEW") navigate(`/property/${n.entityId}`);
  };

  const TYPE_ICON: Record<string, string> = {
    BOOKING_NEW: "📅", BOOKING_CONFIRMED: "✅", BOOKING_CANCELLED: "❌",
    MESSAGE_NEW: "💬", REVIEW_NEW: "⭐", PROPERTY_APPROVED: "✅", PROPERTY_REJECTED: "❌",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-modal border border-gray-100 z-50 animate-slide-up overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 text-sm">Уведомления</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Прочитать все
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Уведомлений нет</p>
            ) : (
              notifications.slice(0, 20).map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 ${!n.isRead ? "bg-blue-50/60" : ""}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("ru-RU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shadow-sm">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">DomRent</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive("/") ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              Поиск
            </Link>
            {user && (
              <Link
                to="/bookings"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive("/bookings") ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
              >
                Бронирования
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Add property (LANDLORD) */}
                {user.role === 'LANDLORD' && (
                  <Link
                    to="/create-property"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden lg:inline">Добавить</span>
                  </Link>
                )}

                {/* Admin */}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden lg:inline">Панель</span>
                  </Link>
                )}

                {/* Favorites */}
                <Link
                  to="/favorites"
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Избранное"
                >
                  <Heart className="w-5 h-5 text-gray-600" />
                </Link>

                {/* Notifications */}
                <NotificationsBell />

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 hover:shadow-md transition-all ml-1"
                  >
                    <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {(user.name || user.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.name || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-modal border border-gray-100 py-1.5 z-50 animate-slide-up">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.name || "Пользователь"}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                          user.role === "LANDLORD" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {user.role === "ADMIN" ? "Администратор" : user.role === "LANDLORD" ? "Арендодатель" : "Арендатор"}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link to="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Calendar className="w-4 h-4 text-gray-400" />Мои бронирования
                        </Link>
                        <Link to="/favorites" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Heart className="w-4 h-4 text-gray-400" />Избранное
                        </Link>
                        {user.role === 'LANDLORD' && (
                          <Link to="/create-property" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Plus className="w-4 h-4 text-gray-400" />Добавить объект
                          </Link>
                        )}
                        {user.role === 'ADMIN' && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-medium">
                            <Shield className="w-4 h-4 text-purple-500" />Админ-панель
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Регистрация
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 animate-slide-up">
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Home className="w-4 h-4 text-gray-400" />Поиск жилья
            </Link>
            {user && (
              <>
                <Link to="/bookings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Calendar className="w-4 h-4 text-gray-400" />Бронирования
                </Link>
                <Link to="/favorites" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Heart className="w-4 h-4 text-gray-400" />Избранное
                </Link>
                {user.role === 'LANDLORD' && (
                  <Link to="/create-property" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Plus className="w-4 h-4 text-gray-400" />Добавить объект
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50">
                    <Shield className="w-4 h-4 text-purple-500" />Панель администратора
                  </Link>
                )}
                <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" />Выйти
                </button>
              </>
            )}
            {!user && (
              <>
                <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4 text-gray-400" />Войти
                </Link>
                <Link to="/register" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 mx-1">
                  <Plus className="w-4 h-4" />Зарегистрироваться
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <Navbar />
          <main>
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
