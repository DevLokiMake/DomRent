import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Loader, AlertCircle, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import type { PropertyWithOwner } from "../types";

const PropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: ""
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchProperty() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/properties/${id}`);
        if (!ignore) {
          setProperty(res.data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Не удалось загрузить объект";
          setError(message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchProperty();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingData.startDate || !bookingData.endDate) {
      alert("Пожалуйста, выберите даты бронирования");
      return;
    }

    setBookingLoading(true);
    try {
      await api.post("/bookings", {
        propertyId: id,
        startDate: new Date(bookingData.startDate),
        endDate: new Date(bookingData.endDate)
      });
      alert("Бронирование успешно создано!");
      setBookingData({ startDate: "", endDate: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка при бронировании";
      alert(message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-medium">Загрузка объекта...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-100 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-700 font-medium mb-4">{error || "Объект не найден"}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header с кнопкой назад */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Большое фото */}
          <div className="relative w-full h-96">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-lg">Нет фотографии</span>
              </div>
            )}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-blue-600 px-4 py-2 rounded-full font-bold uppercase text-sm">
              {property.type}
            </div>
          </div>

          {/* Контент */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Основная информация */}
              <div className="lg:col-span-2">
                {/* Название и цена */}
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                    <span className="text-lg">{property.city}</span>
                  </div>
                  <div className="text-4xl font-black text-blue-600 mb-4">
                    {property.price.toLocaleString()} <span className="text-2xl">₸/ночь</span>
                  </div>
                </div>

                {/* Описание */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">О объекте</h2>
                  <p className="text-gray-600 leading-relaxed text-lg">{property.description}</p>
                </div>

                {/* Информация о владельце */}
                {property.owner && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Владелец</h3>
                    <p className="text-gray-700 font-semibold mb-1">{property.owner.name || "Нет имени"}</p>
                    <p className="text-gray-600">{property.owner.email}</p>
                    {property.owner.phone && (
                      <p className="text-gray-600">{property.owner.phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Форма бронирования */}
              <div className="lg:col-span-1">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 sticky top-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Забронировать</h3>

                  <form onSubmit={handleBooking} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Дата заезда
                      </label>
                      <input
                        type="date"
                        value={bookingData.startDate}
                        onChange={(e) =>
                          setBookingData({ ...bookingData, startDate: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Дата выезда
                      </label>
                      <input
                        type="date"
                        value={bookingData.endDate}
                        onChange={(e) =>
                          setBookingData({ ...bookingData, endDate: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {bookingLoading ? "Обработка..." : "Забронировать"}
                    </button>
                  </form>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    После бронирования владелец свяжется с вами
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPage;
