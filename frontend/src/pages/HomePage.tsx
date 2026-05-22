import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Loader, AlertCircle } from "lucide-react";
import api from "../api/axios";
import type { Property } from "../types";

const HomePage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Используем useCallback, чтобы функцию можно было безопасно использовать в useEffect
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Сбрасываем ошибку перед новым запросом
      const res = await api.get("/properties");
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
  }, []);

  useEffect(() => {
    let ignore = false;

    async function startFetching() {
      if (!ignore) {
        await fetchProperties();
      }
    }

    startFetching();

    return () => {
      ignore = true;
    };
  }, [fetchProperties]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-medium">Загрузка объектов...</p>
        </div>
      </div>
    );
  }

  // Исправлено: теперь переменная error используется для вывода сообщения
  if (error || !Array.isArray(properties)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-100 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-700 font-medium mb-2">
            Ошибка загрузки данных
          </p>
          <p className="text-red-500 text-sm mb-6">
            {error || "Получен некорректный формат данных"}
          </p>
          <button
            onClick={fetchProperties}
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
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          Найдите жилье своей мечты
        </h1>
        <p className="text-lg text-gray-600">
          Обзор доступных объектов недвижимости в Казахстане
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed">
          <p className="text-gray-400 text-xl font-medium">
            Пока нет доступных объектов для аренды
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group"
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
                  <span className="text-sm font-medium">{property.city}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className="text-2xl font-black text-gray-900">
                    {property.price.toLocaleString()}{" "}
                    <span className="text-blue-600">₸</span>
                  </span>
                  <Link
                    to={`/property/${property.id}`}
                    className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
                  >
                    Подробнее →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
