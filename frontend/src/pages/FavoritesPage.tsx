import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Loader, AlertCircle, MapPin, X } from "lucide-react";
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

  useEffect(() => {
    let ignore = false;
    if (!user) { setLoading(false); return; }

    setLoading(true);
    setError(null);
    axiosInstance.get("/favorites")
      .then(res => { if (!ignore) setFavorites(res.data.favorites || []); })
      .catch(err => { if (!ignore) setError(err instanceof Error ? err.message : "Не удалось загрузить"); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [user]);

  const handleRemoveFavorite = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => prev.filter(p => p.id !== propertyId));
    setRemovingIds(prev => new Set(prev).add(propertyId));
    try {
      await axiosInstance.post(`/favorites/toggle/${propertyId}`);
    } catch {
      const property = favorites.find(p => p.id === propertyId);
      if (property) setFavorites(prev => [...prev, property]);
    } finally {
      setRemovingIds(prev => { const s = new Set(prev); s.delete(propertyId); return s; });
    }
  };

  const getPriceText = (p: Property) =>
    p.contractType === 'RENT' ? `${p.price.toLocaleString()} ₸/ночь` : `${p.price.toLocaleString()} ₸`;

  const getCityName = (p: Property): string => {
    if (typeof p.city === 'object' && p.city !== null && 'name' in p.city)
      return (p.city as { name: string }).name;
    return (p.city as string) || '';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-gray-900 p-12 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800 max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Войдите в аккаунт</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Чтобы просматривать избранное</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-2xl hover:bg-gray-700 dark:hover:bg-gray-100 transition"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 text-sm">Загрузка избранного...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md flex gap-4 border border-gray-100 dark:border-gray-800 shadow-card">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Ошибка загрузки</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-red-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Список избранного пуст</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
              Добавляйте понравившиеся объекты, нажимая на сердечко
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-2xl hover:bg-gray-700 dark:hover:bg-gray-100 transition text-sm"
            >
              Начать поиск
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Избранное</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {favorites.length} {favorites.length === 1 ? "объект" : favorites.length < 5 ? "объекта" : "объектов"}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map(property => (
            <Link
              key={property.id}
              to={`/property/${property.id}`}
              className="group bg-white dark:bg-gray-900 rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-800 block"
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-gray-200 dark:text-gray-700" />
                  </div>
                )}

                {/* Type badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 capitalize">
                  {property.type}
                </div>

                {/* Remove button */}
                <button
                  onClick={e => handleRemoveFavorite(property.id, e)}
                  disabled={removingIds.has(property.id)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform disabled:opacity-50"
                  title="Удалить из избранного"
                >
                  {removingIds.has(property.id)
                    ? <Loader className="w-4 h-4 animate-spin text-gray-400" />
                    : <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  }
                </button>

                {property.contractType === "SALE" && (
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-gray-900/80 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                    Продажа
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 mb-1 group-hover:text-brand-500 transition-colors">
                  {property.title}
                </h3>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-3">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{getCityName(property)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{getPriceText(property)}</p>
                  <button
                    onClick={e => handleRemoveFavorite(property.id, e)}
                    disabled={removingIds.has(property.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Удалить
                  </button>
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
