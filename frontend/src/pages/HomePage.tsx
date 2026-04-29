import { useEffect, useState } from 'react';
import { MapPin, Loader, AlertCircle } from 'lucide-react';
import axiosInstance from '../api/axios';
import { Property } from '../types';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/properties');
      setProperties(response.data.properties || response.data);
    } catch (err: any) {
      console.error('Ошибка при загрузке объектов:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить объекты');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Загрузка объектов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProperties}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок страницы */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">DomRent</h1>
          <p className="text-gray-600 mt-2">Найдите идеальное жилье для проживания</p>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">К сожалению, объектов не найдено</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Всего найдено объектов: <span className="font-semibold">{properties.length}</span>
            </p>

            {/* Сетка карточек */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  {/* Изображение */}
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-gray-600">Нет изображения</span>
                      </div>
                    )}
                    {/* Тип жилья */}
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {property.type}
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-4">
                    {/* Название */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {property.title}
                    </h2>

                    {/* Описание */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {property.description}
                    </p>

                    {/* Город */}
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{property.city}</span>
                    </div>

                    {/* Цена и кнопка */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <p className="text-gray-600 text-sm">Цена за ночь</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {property.price.toLocaleString('ru-RU')} ₸
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                        Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
