import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Home, Calendar, TrendingUp, ShieldOff, Shield,
  CheckCircle, XCircle, Clock, Search, ChevronLeft, ChevronRight,
  AlertTriangle, Loader, BarChart3
} from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ─── Типы ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  pendingProperties: number;
  totalRevenue: number;
  bannedUsers: number;
  newUsers7d: number;
  newBookings7d: number;
}

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  isBanned: boolean;
  createdAt: string;
  _count: { bookings: number; properties: number };
}

interface AdminProperty {
  id: number;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  price: number;
  type: string;
  createdAt: string;
  city: { name: string };
  owner: { id: number; name: string | null; email: string };
  images: string[];
  coverImage: string | null;
  _count: { bookings: number; reviews: number };
}

// ─── Статистические карточки ──────────────────────────────────────────────────

const StatCard = ({
  icon, label, value, sub, color
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <p className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-gray-50`}>{icon}</div>
    </div>
  </div>
);

// ─── Главный компонент ────────────────────────────────────────────────────────

type Tab = "stats" | "users" | "moderation";

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");

  // Redirect non-admin
  useEffect(() => {
    if (user && user.role !== "ADMIN") navigate("/");
  }, [user, navigate]);

  // ─── Статистика ───────────────────────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (tab !== "stats") return;
    axiosInstance.get("/admin/stats")
      .then(r => setStats(r.data.stats))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [tab]);

  // ─── Пользователи ─────────────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [banningId, setBanningId] = useState<number | null>(null);

  const fetchUsers = useCallback(async (page = 1, search = "") => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      const r = await axiosInstance.get(`/admin/users?${params}`);
      setUsers(r.data.users);
      setUsersTotal(r.data.total);
    } catch (err) { console.error(err); }
    finally { setUsersLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "users") fetchUsers(usersPage, usersSearch);
  }, [tab, usersPage, fetchUsers]);

  const handleBan = async (userId: number, banned: boolean) => {
    if (!window.confirm(banned ? "Заблокировать пользователя?" : "Разблокировать пользователя?")) return;
    setBanningId(userId);
    try {
      await axiosInstance.patch(`/admin/users/${userId}/ban`, { banned });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: banned } : u));
    } catch (err: unknown) {
      alert((err as any).response?.data?.error || "Ошибка");
    } finally { setBanningId(null); }
  };

  // ─── Модерация ────────────────────────────────────────────────────────────
  const [modFilter, setModFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [modProps, setModProps] = useState<AdminProperty[]>([]);
  const [modTotal, setModTotal] = useState(0);
  const [modPage, setModPage] = useState(1);
  const [modLoading, setModLoading] = useState(false);
  const [moderatingId, setModeratingId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchMod = useCallback(async (page = 1, status = "PENDING") => {
    setModLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10", status });
      const r = await axiosInstance.get(`/admin/properties?${params}`);
      setModProps(r.data.properties);
      setModTotal(r.data.total);
    } catch (err) { console.error(err); }
    finally { setModLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "moderation") fetchMod(modPage, modFilter);
  }, [tab, modPage, modFilter, fetchMod]);

  const handleApprove = async (id: number) => {
    setModeratingId(id);
    try {
      await axiosInstance.patch(`/admin/properties/${id}/approve`);
      setModProps(prev => prev.filter(p => p.id !== id));
      setModTotal(t => t - 1);
    } catch (err: unknown) {
      alert((err as any).response?.data?.error || "Ошибка");
    } finally { setModeratingId(null); }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      alert("Укажите причину отклонения");
      return;
    }
    setModeratingId(rejectModal.id);
    try {
      await axiosInstance.patch(`/admin/properties/${rejectModal.id}/reject`, { reason: rejectReason });
      setModProps(prev => prev.filter(p => p.id !== rejectModal.id));
      setModTotal(t => t - 1);
      setRejectModal(null);
      setRejectReason("");
    } catch (err: unknown) {
      alert((err as any).response?.data?.error || "Ошибка");
    } finally { setModeratingId(null); }
  };

  const ROLE_COLORS: Record<string, string> = {
    USER: "bg-gray-100 text-gray-700",
    LANDLORD: "bg-blue-100 text-blue-700",
    ADMIN: "bg-purple-100 text-purple-700",
  };

  const STATUS_CFG = {
    PENDING: { label: "На проверке", bg: "bg-yellow-100", text: "text-yellow-700", icon: <Clock className="w-4 h-4" /> },
    APPROVED: { label: "Одобрено", bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
    REJECTED: { label: "Отклонено", bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="w-4 h-4" /> },
  };

  const totalUsersPages = Math.ceil(usersTotal / 15);
  const totalModPages = Math.ceil(modTotal / 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-black text-gray-900">Панель администратора</h1>
          </div>
          <p className="text-gray-500 ml-11">Управление платформой DomRent</p>
        </div>

        {/* Навигация по табам */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 w-fit">
          {([
            { id: "stats", label: "Статистика", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "users", label: "Пользователи", icon: <Users className="w-4 h-4" /> },
            { id: "moderation", label: "Модерация", icon: <Home className="w-4 h-4" />, badge: stats?.pendingProperties },
          ] as { id: Tab; label: string; icon: React.ReactNode; badge?: number }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition relative ${
                tab === t.id ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.icon}{t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── СТАТИСТИКА ──────────────────────────────────────────────────── */}
        {tab === "stats" && (
          statsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-10 h-10 animate-spin text-purple-600" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Пользователей" value={stats.totalUsers} sub={`+${stats.newUsers7d} за 7 дней`} color="text-blue-600" />
                <StatCard icon={<Home className="w-6 h-6 text-green-600" />} label="Объявлений" value={stats.totalProperties} sub={`${stats.pendingProperties} на модерации`} color="text-green-600" />
                <StatCard icon={<Calendar className="w-6 h-6 text-orange-600" />} label="Бронирований" value={stats.totalBookings} sub={`+${stats.newBookings7d} за 7 дней`} color="text-orange-600" />
                <StatCard icon={<TrendingUp className="w-6 h-6 text-purple-600" />} label="Оборот (₸)" value={stats.totalRevenue.toLocaleString()} color="text-purple-600" />
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <StatCard icon={<ShieldOff className="w-6 h-6 text-red-500" />} label="Заблокировано" value={stats.bannedUsers} color="text-red-500" />
                <StatCard icon={<Clock className="w-6 h-6 text-yellow-600" />} label="На модерации" value={stats.pendingProperties} color="text-yellow-600" />
              </div>
            </div>
          ) : <p className="text-gray-500">Нет данных</p>
        )}

        {/* ─── ПОЛЬЗОВАТЕЛИ ────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div>
            {/* Поиск */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={usersSearch}
                  onChange={e => setUsersSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { setUsersPage(1); fetchUsers(1, usersSearch); } }}
                  placeholder="Поиск по email или имени..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                />
              </div>
              <button
                onClick={() => { setUsersPage(1); fetchUsers(1, usersSearch); }}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition"
              >
                Найти
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-3">Всего: <strong>{usersTotal}</strong></p>

            {usersLoading ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-purple-600" /></div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["ID", "Пользователь", "Роль", "Объекты", "Брони", "Дата", "Статус", "Действие"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50 transition ${u.isBanned ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3 text-gray-500">#{u.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{u.name || "—"}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{u._count.properties}</td>
                        <td className="px-4 py-3 text-center">{u._count.bookings}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="px-4 py-3">
                          {u.isBanned ? (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Заблокирован</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Активен</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.role !== "ADMIN" && (
                            <button
                              onClick={() => handleBan(u.id, !u.isBanned)}
                              disabled={banningId === u.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40 ${
                                u.isBanned
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              {banningId === u.id ? <Loader className="w-3 h-3 animate-spin" /> :
                                u.isBanned ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                              {u.isBanned ? "Разблокировать" : "Заблокировать"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Пагинация */}
            {totalUsersPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Стр. {usersPage} / {totalUsersPages}</span>
                <button onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))} disabled={usersPage === totalUsersPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── МОДЕРАЦИЯ ───────────────────────────────────────────────────── */}
        {tab === "moderation" && (
          <div>
            {/* Фильтр по статусу */}
            <div className="flex gap-2 mb-5">
              {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => {
                const cfg = STATUS_CFG[s];
                return (
                  <button
                    key={s}
                    onClick={() => { setModFilter(s); setModPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                      modFilter === s
                        ? `${cfg.bg} ${cfg.text} border-transparent`
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {cfg.icon}{cfg.label}
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-gray-500 mb-4">Найдено: <strong>{modTotal}</strong></p>

            {modLoading ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-purple-600" /></div>
            ) : modProps.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                <p className="font-medium">Нет объявлений со статусом «{STATUS_CFG[modFilter].label}»</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {modProps.map(p => {
                  const cfg = STATUS_CFG[p.status];
                  const cover = p.coverImage || p.images?.[0];
                  return (
                    <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="flex gap-4 p-4">
                        {/* Фото */}
                        <div className="w-28 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                          {cover ? (
                            <img src={cover} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Нет фото</div>
                          )}
                        </div>
                        {/* Инфо */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{p.title}</h3>
                            <span className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                              {cfg.icon}{cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{p.city?.name} · {p.type} · {p.price.toLocaleString()} ₸</p>
                          <p className="text-xs text-gray-400">
                            Владелец: <span className="text-gray-700 font-medium">{p.owner?.name || p.owner?.email}</span>
                          </p>
                          <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString("ru-RU")}</p>
                          {p.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1 flex gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{p.rejectionReason}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Действия */}
                      {p.status === "PENDING" && (
                        <div className="flex gap-2 px-4 pb-4">
                          <button
                            onClick={() => handleApprove(p.id)}
                            disabled={moderatingId === p.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                          >
                            {moderatingId === p.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Одобрить
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: p.id, title: p.title })}
                            disabled={moderatingId === p.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-xl transition disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Отклонить
                          </button>
                        </div>
                      )}
                      {p.status !== "PENDING" && (
                        <div className="px-4 pb-4 flex gap-2">
                          {/* Re-moderate already processed */}
                          {p.status === "REJECTED" && (
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={moderatingId === p.id}
                              className="flex items-center gap-1.5 py-2 px-4 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-semibold rounded-xl transition"
                            >
                              <CheckCircle className="w-4 h-4" /> Одобрить всё же
                            </button>
                          )}
                          {p.status === "APPROVED" && (
                            <button
                              onClick={() => setRejectModal({ id: p.id, title: p.title })}
                              disabled={moderatingId === p.id}
                              className="flex items-center gap-1.5 py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-xl transition"
                            >
                              <XCircle className="w-4 h-4" /> Снять с публикации
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Пагинация модерации */}
            {totalModPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <button onClick={() => setModPage(p => Math.max(1, p - 1))} disabled={modPage === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Стр. {modPage} / {totalModPages}</span>
                <button onClick={() => setModPage(p => Math.min(totalModPages, p + 1))} disabled={modPage === totalModPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модал: причина отклонения */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Отклонить объявление</h2>
            <p className="text-gray-500 text-sm mb-4">«{rejectModal.title}»</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Укажите причину отклонения (видна арендодателю)..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={moderatingId === rejectModal.id}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
              >
                {moderatingId === rejectModal.id ? "Обработка..." : "Отклонить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
