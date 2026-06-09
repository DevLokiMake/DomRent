import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Loader, AlertCircle, MapPin } from "lucide-react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Property } from "../types";

interface FavoriteProperty extends Property {
  isFavorited?: boolean;
}

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  // Загрузка избранного
  useEffect(() => {
    let ignore = false;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get("/favorites");
        if (!ignore) {
          setFavorites(res.data.favorites || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message =
            err instanceof Error ? err.message : "Не удалось загрузить избранное";
          setError(message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (!user) {
      setLoading(false);
      return;
    }

    fetchFavorites();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Обработчик удаления из избранного с оптимистичным обновлением
  const handleRemoveFavorite = async (propertyId: number) => {
    // Оптимистичное обновление - сразу удаляем из UI
    setFavorites(favorites.filter(p => p.id !== propertyId));
    setRemovingIds(prev => new Set(prev).add(propertyId));

    try {
      // В фоне отправляем запрос на бэкенд
      await axiosInstance.post(`/favorites/toggle/${propertyId}`);
    } catch (err: unknown) {
      // Если ошибка, возвращаем обратно
      const property = favorites.find(p => p.id === propertyId);
      if (property) {
        setFavorites(prev => [...prev, property]);
      }

      const message =
        err instanceof Error
          ? err.message
          : "Ошибка при удалении из избранного";
      alert(message);
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
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
  const getCityName = (property: Property): string => {
    if (typeof property.city === 'object' && property.city !== null && 'name' in property.city) {
      return (property.city as { name: string }).name;
    }
    return (property.city as string) || 'Город не указан';
  };

  // Если не авторизован
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-blue-50 p-12 rounded-2xl border border-blue-200 max-w-md">
          <Heart className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Авторизуйтесь
          </h2>
          <p className="text-gray-600 mb-6">
            Чтобы просмотреть избранное, пожалуйста, войдите в аккаунт
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Перейти к входу
          </button>
        </div>
      </div>
    );
  }

  // Состояние загрузки
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-medium">Загрузка избранного...</p>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Ошибка загрузки</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Пустое избранное
  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Список избранного пуст
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Добавьте дома, которые вам понравились, в избранное и они появятся здесь
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition inline-block"
            >
              Начать поиск
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Основной контент с сеткой
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Избранное</h1>
          <p className="text-gray-600 text-lg">
            {favorites.length}{" "}
            {favorites.length === 1
              ? "объект"
              : favorites.length < 5
                ? "объекта"
                : "объектов"}{" "}
            добавлено
          </p>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(property => (
            <Link
              key={property.id}
              to={`/property/${property.id}`}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100 no-underline"
            >
              {/* Изображение */}
              <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <span className="text-gray-500 text-center px-4">
                      Нет фотографии
                    </span>
                  </div>
                )}

                {/* Тип объекта */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                  {property.type}
                </div>

                {/* Кнопка удаления из избранного */}
                <button
                  onClick={() => handleRemoveFavorite(property.id)}
                  disabled={removingIds.has(property.id)}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-2.5 transition disabled:opacity-50 shadow-md"
                  title="Удалить из избранного"
                >
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </button>
              </div>

              {/* Информация */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                  {property.title}
                </h3>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                  <span className="text-sm">{getCityName(property)}</span>
                </div>

                {/* Описание */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {property.description}
                </p>

                {/* Цена */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {property.contractType === 'RENT' ? 'Цена за сутки' : 'Стоимость'}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getPriceText(property)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
