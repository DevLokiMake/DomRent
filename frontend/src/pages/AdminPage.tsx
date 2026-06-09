import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Home, Calendar, TrendingUp, ShieldOff, Shield,
  CheckCircle, XCircle, Clock, Search, ChevronLeft, ChevronRight,
  AlertTriangle, Loader, BarChart3, ArrowUpRight
} from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = ({
  icon, label, value, sub, trend, color
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; trend?: string; color: string;
}) => (
  <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 hover:shadow-card-hover transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-2xl ${color.replace("text-", "bg-").split("-")[0]}-50`}>
        {icon}
      </div>
      {trend && (
        <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <ArrowUpRight className="w-3 h-3" />{trend}
        </span>
      )}
    </div>
    <p className={`text-3xl font-black mb-1 ${color}`}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
    <p className="text-sm font-semibold text-gray-700">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "stats" | "users" | "moderation";

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");

  // Redirect non-admin
  useEffect(() => {
    if (user && user.role !== "ADMIN") navigate("/");
  }, [user, navigate]);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (tab !== "stats") return;
    axiosInstance.get("/admin/stats")
      .then(r => setStats(r.data.stats))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [tab]);

  // ─── Users ────────────────────────────────────────────────────────────────
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

  // ─── Moderation ───────────────────────────────────────────────────────────
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

  const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
    USER:     { label: "Арендатор", cls: "bg-gray-100 text-gray-700" },
    LANDLORD: { label: "Арендодатель", cls: "bg-blue-100 text-blue-700" },
    ADMIN:    { label: "Администратор", cls: "bg-violet-100 text-violet-700" },
  };

  const STATUS_CFG = {
    PENDING:  { label: "На проверке", bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200",  icon: <Clock className="w-3.5 h-3.5" /> },
    APPROVED: { label: "Одобрено",    bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",icon: <CheckCircle className="w-3.5 h-3.5" /> },
    REJECTED: { label: "Отклонено",   bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",    icon: <XCircle className="w-3.5 h-3.5" /> },
  };

  const totalUsersPages = Math.ceil(usersTotal / 15);
  const totalModPages = Math.ceil(modTotal / 10);

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "stats",      label: "Статистика",    icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users",      label: "Пользователи",  icon: <Users className="w-4 h-4" /> },
    { id: "moderation", label: "Модерация",     icon: <Home className="w-4 h-4" />, badge: stats?.pendingProperties },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Панель администратора</h1>
            <p className="text-gray-500 text-sm">Управление платформой DomRent</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-8 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition ${
                tab === t.id ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t.icon}{t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── STATS ────────────────────────────────────────────────────────── */}
        {tab === "stats" && (
          statsLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : stats ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Users className="w-5 h-5 text-blue-600" />}
                  label="Пользователей"
                  value={stats.totalUsers}
                  trend={`+${stats.newUsers7d} за 7д`}
                  color="text-blue-600"
                />
                <StatCard
                  icon={<Home className="w-5 h-5 text-emerald-600" />}
                  label="Объявлений"
                  value={stats.totalProperties}
                  sub={`${stats.pendingProperties} на модерации`}
                  color="text-emerald-600"
                />
                <StatCard
                  icon={<Calendar className="w-5 h-5 text-orange-600" />}
                  label="Бронирований"
                  value={stats.totalBookings}
                  trend={`+${stats.newBookings7d} за 7д`}
                  color="text-orange-600"
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
                  label="Оборот"
                  value={`${stats.totalRevenue.toLocaleString()} ₸`}
                  color="text-violet-600"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
                <StatCard
                  icon={<ShieldOff className="w-5 h-5 text-red-500" />}
                  label="Заблокировано"
                  value={stats.bannedUsers}
                  color="text-red-500"
                />
                <StatCard
                  icon={<Clock className="w-5 h-5 text-amber-600" />}
                  label="На модерации"
                  value={stats.pendingProperties}
                  color="text-amber-600"
                />
              </div>
            </div>
          ) : <p className="text-gray-400 py-10 text-center">Нет данных</p>
        )}

        {/* ─── USERS ────────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div>
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={usersSearch}
                  onChange={e => setUsersSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { setUsersPage(1); fetchUsers(1, usersSearch); } }}
                  placeholder="Поиск по email или имени..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 text-sm transition-all"
                />
              </div>
              <button
                onClick={() => { setUsersPage(1); fetchUsers(1, usersSearch); }}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl font-semibold text-sm transition"
              >
                Найти
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-3">
              Всего: <strong className="text-gray-700">{usersTotal}</strong>
            </p>

            {usersLoading ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : (
              <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["ID", "Пользователь", "Роль", "Объекты", "Брони", "Дата", "Статус", ""].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => {
                      const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.USER;
                      return (
                        <tr key={u.id} className={`hover:bg-gray-50/50 transition ${u.isBanned ? "opacity-50" : ""}`}>
                          <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">#{u.id}</td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-gray-900 text-sm">{u.name || "—"}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleCfg.cls}`}>
                              {roleCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold text-gray-700">{u._count.properties}</td>
                          <td className="px-4 py-3.5 text-center font-semibold text-gray-700">{u._count.bookings}</td>
                          <td className="px-4 py-3.5 text-gray-400 text-xs">
                            {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="px-4 py-3.5">
                            {u.isBanned ? (
                              <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-200">Заблокирован</span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">Активен</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {u.role !== "ADMIN" && (
                              <button
                                onClick={() => handleBan(u.id, !u.isBanned)}
                                disabled={banningId === u.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-40 ${
                                  u.isBanned
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalUsersPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}
                  className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 font-medium">{usersPage} / {totalUsersPages}</span>
                <button onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))} disabled={usersPage === totalUsersPages}
                  className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── MODERATION ───────────────────────────────────────────────────── */}
        {tab === "moderation" && (
          <div>
            {/* Status filter */}
            <div className="flex gap-2 mb-5">
              {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => {
                const cfg = STATUS_CFG[s];
                return (
                  <button
                    key={s}
                    onClick={() => { setModFilter(s); setModPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition border ${
                      modFilter === s
                        ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {cfg.icon}{cfg.label}
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Найдено: <strong className="text-gray-700">{modTotal}</strong>
            </p>

            {modLoading ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : modProps.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-14 h-14 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">Нет объявлений со статусом «{STATUS_CFG[modFilter].label}»</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {modProps.map(p => {
                  const cfg = STATUS_CFG[p.status];
                  const cover = p.coverImage || p.images?.[0];
                  return (
                    <div key={p.id} className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden hover:shadow-card-hover transition-all">
                      <div className="flex gap-0">
                        {/* Photo */}
                        <div className="w-36 flex-shrink-0 bg-gray-100 min-h-[120px]">
                          {cover ? (
                            <img src={cover} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Home className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">{p.title}</h3>
                            <span className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              {cfg.icon}{cfg.label}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mb-1">{p.city?.name} · {p.type}</p>
                          <p className="text-sm font-bold text-gray-900 mb-1">{p.price.toLocaleString()} ₸</p>
                          <p className="text-xs text-gray-400">
                            <span className="font-medium text-gray-600">{p.owner?.name || p.owner?.email}</span>
                            {" · "}{new Date(p.createdAt).toLocaleDateString("ru-RU")}
                          </p>

                          {p.rejectionReason && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-xl px-2.5 py-2">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{p.rejectionReason}</span>
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            {p.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApprove(p.id)}
                                  disabled={moderatingId === p.id}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                  {moderatingId === p.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  Одобрить
                                </button>
                                <button
                                  onClick={() => setRejectModal({ id: p.id, title: p.title })}
                                  disabled={moderatingId === p.id}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Отклонить
                                </button>
                              </>
                            )}
                            {p.status === "REJECTED" && (
                              <button
                                onClick={() => handleApprove(p.id)}
                                disabled={moderatingId === p.id}
                                className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Одобрить всё же
                              </button>
                            )}
                            {p.status === "APPROVED" && (
                              <button
                                onClick={() => setRejectModal({ id: p.id, title: p.title })}
                                disabled={moderatingId === p.id}
                                className="flex items-center gap-1.5 py-1.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-xl transition"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Снять с публикации
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Moderation pagination */}
            {totalModPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <button onClick={() => setModPage(p => Math.max(1, p - 1))} disabled={modPage === 1}
                  className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 font-medium">{modPage} / {totalModPages}</span>
                <button onClick={() => setModPage(p => Math.min(totalModPages, p + 1))} disabled={modPage === totalModPages}
                  className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-modal animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Отклонить объявление</h2>
            <p className="text-gray-400 text-sm mb-4">«{rejectModal.title}»</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Укажите причину отклонения (видна арендодателю)..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white resize-none mb-4 text-sm transition-all"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-3 border border-gray-200 rounded-2xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={moderatingId === rejectModal.id}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition disabled:opacity-50"
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
