import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Loader, AlertCircle, Filter, X, Heart, Wifi, Car, PawPrint, BedDouble } from "lucide-react";
import axiosInstance from "../api/axios";
import type { Property } from "../types";

interface FilterState {
  city: string;
  contractType: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  rooms: string;
  hasWifi: boolean;
  hasParking: boolean;
  petsAllowed: boolean;
}

interface City {
  id: number;
  name: string;
}

const EMPTY_FILTERS: FilterState = {
  city: "",
  contractType: "",
  type: "",
  minPrice: "",
  maxPrice: "",
  rooms: "",
  hasWifi: false,
  hasParking: false,
  petsAllowed: false,
};

const HomePage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const fetchProperties = useCallback(async (filtersToUse?: FilterState) => {
    try {
      setLoading(true);
      setError(null);

      const f = filtersToUse ?? filters;
      const q = new URLSearchParams();
      if (f.city)         q.set("city", f.city);
      if (f.contractType) q.set("contractType", f.contractType);
      if (f.type)         q.set("type", f.type);
      if (f.minPrice)     q.set("minPrice", f.minPrice);
      if (f.maxPrice)     q.set("maxPrice", f.maxPrice);
      if (f.rooms)        q.set("rooms", f.rooms);
      if (f.hasWifi)      q.set("hasWifi", "true");
      if (f.hasParking)   q.set("hasParking", "true");
      if (f.petsAllowed)  q.set("petsAllowed", "true");

      const url = `/properties${q.toString() ? `?${q}` : ""}`;
      const res = await axiosInstance.get(url);
      const data = Array.isArray(res.data) ? res.data : res.data.properties || [];
      setProperties(data);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Не удалось загрузить объекты");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCities = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/cities");
      setCities(res.data.cities || []);
    } catch { /* silent */ }
    finally { setCitiesLoading(false); }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/favorites");
      const ids = new Set<number>((res.data.favorites || []).map((f: any) => f.propertyId));
      setFavorites(ids);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchCities(), fetchFavorites()]);
  }, []); // eslint-disable-line

  const handleApplyFilters = () => {
    fetchProperties(filters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    fetchProperties(EMPTY_FILTERS);
  };

  const handleToggleFavorite = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axiosInstance.post(`/favorites/toggle/${propertyId}`);
      setFavorites(prev => {
        const s = new Set(prev);
        s.has(propertyId) ? s.delete(propertyId) : s.add(propertyId);
        return s;
      });
    } catch { /* silent */ }
  };

  const getPriceText = (p: Property) =>
    p.contractType === "RENT" ? `${p.price.toLocaleString()} ₸/ночь` : `${p.price.toLocaleString()} ₸`;

  const getCityName = (p: Property) =>
    typeof p.city === "object" && p.city?.name ? p.city.name : (p.city as string) || "Город не указан";

  const hasActiveFilters = Object.entries(filters).some(([, v]) => v !== "" && v !== false);

  if (error && properties.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-100 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-700 font-medium mb-2">Ошибка загрузки данных</p>
          <p className="text-red-500 text-sm mb-6">{error}</p>
          <button onClick={() => fetchProperties()} className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Найдите жилье своей мечты</h1>
        <p className="text-lg text-gray-600">Обзор доступных объектов недвижимости в Казахстане</p>
      </div>

      {/* FilterBar */}
      <div className="mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden mb-4 w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
        >
          <Filter className="w-5 h-5" />
          {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
          {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-yellow-400" />}
        </button>

        <div className={`bg-white rounded-2xl shadow-md border border-gray-200 p-6 transition-all ${showFilters ? "block" : "hidden lg:block"}`}>
          {/* Строка 1: основные фильтры */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            {/* Тип сделки */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Тип сделки</label>
              <select
                value={filters.contractType}
                onChange={e => setFilters(p => ({ ...p, contractType: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Все</option>
                <option value="RENT">🔑 Аренда</option>
                <option value="SALE">🏠 Продажа</option>
              </select>
            </div>

            {/* Город */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Город</label>
              <select
                value={filters.city}
                onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
                disabled={citiesLoading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Все города</option>
                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* Тип жилья */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Тип жилья</label>
              <select
                value={filters.type}
                onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Все</option>
                <option value="квартира">🏢 Квартира</option>
                <option value="дом">🏡 Дом</option>
                <option value="комната">🛏️ Комната</option>
              </select>
            </div>

            {/* Комнат */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                <BedDouble className="inline w-3 h-3 mr-1" />Комнат
              </label>
              <select
                value={filters.rooms}
                onChange={e => setFilters(p => ({ ...p, rooms: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Любое</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={String(n)}>{n} {n === 5 ? "+" : ""} комн.</option>)}
              </select>
            </div>

            {/* Мин. цена */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Цена от (₸)</label>
              <input
                type="number"
                placeholder="10 000"
                value={filters.minPrice}
                onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Макс. цена */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Цена до (₸)</label>
              <input
                type="number"
                placeholder="100 000"
                value={filters.maxPrice}
                onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Строка 2: удобства (чекбоксы) */}
          <div className="flex flex-wrap gap-3 mb-5">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide self-center mr-1">Удобства:</span>
            {([
              { key: "hasWifi",     label: "Wi-Fi",    icon: <Wifi className="w-3.5 h-3.5" />     },
              { key: "hasParking",  label: "Парковка", icon: <Car className="w-3.5 h-3.5" />       },
              { key: "petsAllowed", label: "Животные", icon: <PawPrint className="w-3.5 h-3.5" /> },
            ] as { key: keyof FilterState; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilters(p => ({ ...p, [key]: !p[key] }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                  filters[key]
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" />Поиск...</> : "🔍 Применить фильтры"}
            </button>
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />Сбросить
            </button>
          </div>

          {/* Активные фильтры */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
              {filters.contractType && <Tag label={filters.contractType === "RENT" ? "Аренда" : "Продажа"} />}
              {filters.city && <Tag label={`Город: ${filters.city}`} />}
              {filters.type && <Tag label={`Тип: ${filters.type}`} />}
              {filters.rooms && <Tag label={`${filters.rooms} комн.`} />}
              {filters.minPrice && <Tag label={`от ${Number(filters.minPrice).toLocaleString()} ₸`} />}
              {filters.maxPrice && <Tag label={`до ${Number(filters.maxPrice).toLocaleString()} ₸`} />}
              {filters.hasWifi && <Tag label="Wi-Fi" />}
              {filters.hasParking && <Tag label="Парковка" />}
              {filters.petsAllowed && <Tag label="Животные" />}
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && properties.length === 0 && (
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 font-medium">Загрузка объектов...</p>
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <>
          {properties.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400 text-xl font-medium">Объекты не найдены. Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 font-medium mb-6">
                Найдено объектов: <span className="text-blue-600 font-bold">{properties.length}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map(property => (
                  <Link
                    key={property.id}
                    to={`/property/${property.id}`}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group block"
                  >
                    <div className="relative overflow-hidden">
                      {(property.coverImage || property.images?.[0]) ? (
                        <img
                          src={property.coverImage || property.images[0]}
                          alt={property.title}
                          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 font-medium">Нет фотографии</span>
                        </div>
                      )}
                      {/* Избранное */}
                      <button
                        onClick={e => handleToggleFavorite(property.id, e)}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition shadow-md"
                      >
                        <Heart size={20} className={favorites.has(property.id) ? "text-red-600 fill-red-600" : "text-gray-400"} />
                      </button>
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                        {property.type}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2 h-10">{property.description}</p>
                      <div className="flex items-center text-gray-400 mb-3">
                        <MapPin className="w-4 h-4 mr-1.5 text-blue-500" />
                        <span className="text-sm font-medium">{getCityName(property)}</span>
                        {property.rooms && (
                          <span className="ml-3 flex items-center gap-1 text-xs text-gray-400">
                            <BedDouble className="w-3.5 h-3.5" />{property.rooms} комн.
                          </span>
                        )}
                      </div>
                      {/* Иконки удобств */}
                      {(property.hasWifi || property.hasParking || property.petsAllowed) && (
                        <div className="flex gap-2 mb-3">
                          {property.hasWifi && <span className="flex items-center gap-1 text-xs text-blue-500"><Wifi className="w-3.5 h-3.5" />Wi-Fi</span>}
                          {property.hasParking && <span className="flex items-center gap-1 text-xs text-gray-500"><Car className="w-3.5 h-3.5" />Парковка</span>}
                          {property.petsAllowed && <span className="flex items-center gap-1 text-xs text-green-500"><PawPrint className="w-3.5 h-3.5" />Животные</span>}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-2xl font-black text-gray-900">{getPriceText(property)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Маленький тег для активных фильтров
const Tag = ({ label }: { label: string }) => (
  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{label}</span>
);

export default HomePage;
