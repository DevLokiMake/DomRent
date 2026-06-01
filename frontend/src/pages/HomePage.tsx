import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Loader, AlertCircle, Filter, X, Heart } from "lucide-react";
import axiosInstance from "../api/axios";
import type { Property } from "../types";

interface FilterState {
  city: string;
  contractType: string;
  type: string;
  minPrice: string;
  maxPrice: string;
}

interface City {
  id: number;
  name: string;
}

const HomePage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Состояние фильтров
  const [filters, setFilters] = useState<FilterState>({
    city: "",
    contractType: "",
    type: "",
    minPrice: "",
    maxPrice: "",
  });

  // Используем useCallback, чтобы функцию можно было безопасно использовать в useEffect
  const fetchProperties = useCallback(async (filtersToUse?: FilterState) => {
    try {
      setLoading(true);
      setError(null);

      // Используем переданные фильтры или текущие
      const activeFilters = filtersToUse || filters;

      // Построение query-параметров
      const queryParams = new URLSearchParams();
      if (activeFilters.city) queryParams.append("city", activeFilters.city);
      if (activeFilters.contractType) queryParams.append("contractType", activeFilters.contractType);
      if (activeFilters.type) queryParams.append("type", activeFilters.type);
      if (activeFilters.minPrice) queryParams.append("minPrice", activeFilters.minPrice);
      if (activeFilters.maxPrice) queryParams.append("maxPrice", activeFilters.maxPrice);

      const url = `/properties${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await axiosInstance.get(url);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.properties || [];
      setProperties(data);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить объекты";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Загрузка городов
  const fetchCities = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/cities');
      setCities(response.data.cities || []);
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  // Загрузка избранного
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/favorites');
      const favIds = new Set((response.data.favorites || []).map((f: any) => f.propertyId));
      setFavorites(favIds);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, []);

  // Загрузка при первом монтировании
  useEffect(() => {
    let ignore = false;

    async function startFetching() {
      if (!ignore) {
        await fetchProperties();
        await fetchCities();
        await fetchFavorites();
      }
    }

    startFetching();

    return () => {
      ignore = true;
    };
  }, [fetchProperties, fetchCities, fetchFavorites]);

  // Обработчик изменения фильтров
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Обработчик применения фильтров
  const handleApplyFilters = async () => {
    await fetchProperties(filters);
    setShowFilters(false); // Закрываем панель на мобильных
  };

  // Обработчик сброса фильтров
  const handleResetFilters = async () => {
    const emptyFilters: FilterState = {
      city: "",
      contractType: "",
      type: "",
      minPrice: "",
      maxPrice: "",
    };
    setFilters(emptyFilters);
    await fetchProperties(emptyFilters);
  };

  // Обработчик toggle избранного
  const handleToggleFavorite = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await axiosInstance.post(`/favorites/toggle/${propertyId}`);
      setFavorites(prev => {
        const newSet = new Set(prev);
        if (newSet.has(propertyId)) {
          newSet.delete(propertyId);
        } else {
          newSet.add(propertyId);
        }
        return newSet;
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Получить текст цены в зависимости от типа сделки
  const getPriceText = (property: Property) => {
    if (property.contractType === 'RENT') {
      return `${property.price.toLocaleString()} ₸ / сутки`;
    }
    return `${property.price.toLocaleString()} ₸`;
  };

  // Получить название города
  const getCityName = (property: Property) => {
    if (typeof property.city === 'object' && property.city?.name) {
      return property.city.name;
    }
    return property.city || 'Город не указан';
  };

  if (error && properties.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-100 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-700 font-medium mb-2">
            Ошибка загрузки данных
          </p>
          <p className="text-red-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => fetchProperties()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          Найдите жилье своей мечты
        </h1>
        <p className="text-lg text-gray-600">
          Обзор доступных объектов недвижимости в Казахстане
        </p>
      </div>

      {/* FilterBar - Панель фильтрации */}
      <div className="mb-8">
        {/* Кнопка открытия фильтров на мобильных */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden mb-4 w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
        >
          <Filter className="w-5 h-5" />
          {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        </button>

        {/* Панель фильтров */}
        <div
          className={`bg-white rounded-2xl shadow-md border border-gray-200 p-6 transition-all duration-300 ${
            showFilters ? "block" : "hidden lg:block"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Тип объявления */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Объявление
              </label>
              <select
                value={filters.contractType}
                onChange={(e) => handleFilterChange("contractType", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white cursor-pointer"
              >
                <option value="">Все типы</option>
                <option value="RENT">🔑 Аренда</option>
                <option value="SALE">🏠 Продажа</option>
              </select>
            </div>

            {/* Город */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Город
              </label>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white cursor-pointer"
                disabled={citiesLoading}
              >
                <option value="">Все города</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* Тип жилья */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Тип жилья
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white cursor-pointer"
              >
                <option value="">Все типы</option>
                <option value="квартира">Квартира</option>
                <option value="дом">Дом</option>
                <option value="комната">Комната</option>
              </select>
            </div>

            {/* Минимальная цена */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Мин. цена (₸)
              </label>
              <input
                type="number"
                placeholder="Например: 10000"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Максимальная цена */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Макс. цена (₸)
              </label>
              <input
                type="number"
                placeholder="Например: 50000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Поиск...
                </>
              ) : (
                "Применить фильтры"
              )}
            </button>
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Сбросить
            </button>
          </div>

          {/* Индикатор активных фильтров */}
          {(filters.contractType || filters.city || filters.type || filters.minPrice || filters.maxPrice) && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
              ✓ Активные фильтры:
              {filters.contractType && ` Тип: ${filters.contractType === 'RENT' ? 'Аренда' : 'Продажа'}`}
              {filters.city && ` | Город: ${filters.city}`}
              {filters.type && ` | Тип: ${filters.type}`}
              {filters.minPrice && ` | От: ${filters.minPrice} ₸`}
              {filters.maxPrice && ` | До: ${filters.maxPrice} ₸`}
            </div>
          )}
        </div>
      </div>

      {/* Состояние загрузки */}
      {loading && properties.length === 0 && (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 font-medium">Загрузка объектов...</p>
          </div>
        </div>
      )}

      {/* Сетка объектов */}
      {!loading && (
        <>
          {properties.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400 text-xl font-medium">
                {error
                  ? "Ошибка загрузки"
                  : "Объекты не найдены. Попробуйте изменить фильтры"}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 font-medium mb-6">
                Найдено объектов: <span className="text-blue-600 font-bold">{properties.length}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    to={`/property/${property.id}`}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group block"
                  >
                    <div className="relative overflow-hidden">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 font-medium">
                            Нет фотографии
                          </span>
                        </div>
                      )}
                      {/* Кнопка избранного */}
                      <button
                        onClick={(e) => handleToggleFavorite(property.id, e)}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition shadow-md"
                        title={favorites.has(property.id) ? "Удалить из избранного" : "Добавить в избранное"}
                      >
                        <Heart
                          size={20}
                          className={favorites.has(property.id) ? "text-red-600 fill-red-600" : "text-gray-400"}
                        />
                      </button>
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                        {property.type}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                        {property.description}
                      </p>
                      <div className="flex items-center text-gray-400 mb-6">
                        <MapPin className="w-4 h-4 mr-1.5 text-blue-500" />
                        <span className="text-sm font-medium">{getCityName(property)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-2xl font-black text-gray-900">
                          {getPriceText(property)}
                        </span>
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

export default HomePage;
