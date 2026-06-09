import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from "../api/axios";
import { AlertCircle, CheckCircle, Loader, Plus, MapPin, Upload, X, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xPng from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

// Fix default Leaflet marker icons for Vite
const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

/** Компонент внутри MapContainer, слушает клики и ставит маркер */
function LocationPicker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface City {
  id: number;
  name: string;
}

interface CreatePropertyForm {
  title: string;
  description: string;
  city: string;
  type: 'квартира' | 'дом' | 'комната';
  contractType: 'RENT' | 'SALE';
  price: string;
  latitude: number | null;
  longitude: number | null;
}

interface ValidationErrors {
  [key: string]: string;
}

const CreatePropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Редирект на логин если не авторизован
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const [form, setForm] = useState<CreatePropertyForm>({
    title: '',
    description: '',
    city: '',
    type: 'квартира',
    contractType: 'RENT',
    price: '',
    latitude: null,
    longitude: null,
  });

  // Фото
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Новые состояния для городов
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [showNewCityInput, setShowNewCityInput] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  // Загрузка городов при монтировании
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setCitiesLoading(true);
        const response = await axiosInstance.get('/cities');
        setCities(response.data.cities || []);
      } catch (err) {
        console.error('Error loading cities:', err);
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    fetchCities();
  }, []);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!form.title.trim()) {
      errors.title = 'Название обязательно';
    }

    if (!form.description.trim()) {
      errors.description = 'Описание обязательно';
    }

    if (!form.city.trim()) {
      errors.city = 'Город обязателен';
    }

    if (!form.price) {
      errors.price = 'Цена обязательна';
    } else if (parseFloat(form.price) <= 0) {
      errors.price = 'Цена должна быть больше нуля';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    // Очистить ошибку поля при изменении
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Загрузка фото
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (uploadedImages.length + files.length > 20) {
      alert("Максимум 20 фотографий");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach(f => formData.append("images", f));
      const res = await axiosInstance.post("/upload/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const urls: string[] = res.data.urls || [];
      setUploadedImages(prev => [...prev, ...urls]);
    } catch (err: any) {
      alert(err.response?.data?.error || "Ошибка загрузки фото");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setUploadedImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (coverIndex >= next.length) setCoverIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  // Добавление нового города
  const handleAddNewCity = async () => {
    if (!newCityName.trim()) {
      alert('Пожалуйста, введите название города');
      return;
    }

    try {
      setLoading(true);
      // Просто добавим город в список локально, так как на бэкенде он создастся автоматически
      const newCity: City = {
        id: Date.now(), // временный ID
        name: newCityName
      };
      setCities([...cities, newCity]);
      setForm(prev => ({ ...prev, city: newCityName }));
      setNewCityName('');
      setShowNewCityInput(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coverImage = uploadedImages[coverIndex] || uploadedImages[0] || null;

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        type: form.type,
        contractType: form.contractType,
        price: parseFloat(form.price),
        images: uploadedImages,
        coverImage,
        latitude: form.latitude,
        longitude: form.longitude,
      };

      await axiosInstance.post('/properties', payload);

      setSuccess(true);

      // Редирект на главную через 1.5 секунды
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating property:', err);

      // Обработка ошибок от бэкенда
      if (err.response?.status === 403) {
        setError('Только арендодатели могут добавлять объекты. Измените свою роль в профиле.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.details) {
        // Ошибки валидации от middleware
        const fieldErrors: ValidationErrors = {};
        err.response.data.details.forEach((detail: any) => {
          fieldErrors[detail.path] = detail.message;
        });
        setValidationErrors(fieldErrors);
        setError('Пожалуйста, исправьте ошибки в форме');
      } else {
        setError('Ошибка при создании объекта. Попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏠 Добавить новый объект
          </h1>
          <p className="text-gray-600">
            Заполните информацию о вашем жилье, чтобы начать принимать бронирования
          </p>
        </div>

        {/* Успешное создание */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Объект успешно создан!</h3>
              <p className="text-green-700 text-sm mt-1">
                Сейчас вы будете перенаправлены на главную страницу...
              </p>
            </div>
          </div>
        )}

        {/* Общая ошибка */}
        {error && !success && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Ошибка</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Форма */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          {/* Название */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
              Название объекта *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              placeholder="Например: Уютная квартира в центре города"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                validationErrors.title
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              disabled={loading}
            />
            {validationErrors.title && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
              Подробное описание *
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Опишите особенности вашего объекта: количество комнат, удобства, инфраструктура рядом..."
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${
                validationErrors.description
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              disabled={loading}
            />
            {validationErrors.description && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Город и Тип */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Город */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
                Город * {showNewCityInput && <span className="text-xs text-blue-600">(добавление нового)</span>}
              </label>
              {!showNewCityInput ? (
                <div className="flex gap-2">
                  <select
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                      validationErrors.city
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    disabled={loading || citiesLoading}
                  >
                    <option value="">Выберите город...</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCityInput(true)}
                    className="px-4 py-2 border border-blue-300 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                    title="Добавить новый город"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="Название города"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCity}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCityInput(false);
                      setNewCityName('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    ✕
                  </button>
                </div>
              )}
              {validationErrors.city && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.city}</p>
              )}
            </div>

            {/* Тип жилья */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-900 mb-2">
                Тип жилья *
              </label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                disabled={loading}
              >
                <option value="квартира">🏢 Квартира</option>
                <option value="дом">🏡 Дом</option>
                <option value="комната">🛏️ Комната</option>
              </select>
            </div>
          </div>

          {/* Тип сделки и цена */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"></div>
            {/* Тип сделки */}
            <div>
              <label htmlFor="contractType" className="block text-sm font-medium text-gray-900 mb-2">
                Тип сделки *
              </label>
              <select
                id="contractType"
                name="contractType"
                value={form.contractType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                disabled={loading}
              >
                <option value="RENT">🔑 Аренда</option>
                <option value="SALE">🏠 Продажа</option>
              </select>
            </div>

            {/* Цена */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">
                Цена {form.contractType === 'RENT' ? 'за ночь' : 'продажи'} (₸) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                placeholder="Например: 50000"
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  validationErrors.price
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
                disabled={loading}
              />
              {validationErrors.price && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.price}</p>
              )}
            </div>

          {/* Фотографии */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Фотографии объекта (до 20 штук)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || uploadedImages.length >= 20}
              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center gap-2 transition disabled:opacity-50"
            >
              {uploading ? (
                <><Loader className="w-8 h-8 animate-spin text-blue-500" /><span className="text-sm text-gray-500">Загрузка...</span></>
              ) : (
                <><Upload className="w-8 h-8 text-gray-400" /><span className="text-sm font-medium text-gray-600">Нажмите для загрузки фото</span><span className="text-xs text-gray-400">JPG, PNG, WebP · до 10 МБ каждое</span></>
              )}
            </button>
            {uploadedImages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Нажмите ★ чтобы сделать обложкой:</p>
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className={`relative rounded-lg overflow-hidden border-2 ${i === coverIndex ? "border-blue-500" : "border-transparent"}`}>
                      <img src={url} alt="" className="w-full h-20 object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-start justify-between p-1">
                        <button type="button" onClick={() => setCoverIndex(i)} title="Сделать обложкой">
                          <Star className={`w-4 h-4 ${i === coverIndex ? "fill-yellow-400 text-yellow-400" : "text-white"}`} />
                        </button>
                        <button type="button" onClick={() => removeImage(i)}>
                          <X className="w-4 h-4 text-white hover:text-red-300" />
                        </button>
                      </div>
                      {i === coverIndex && (
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-0.5">обложка</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Местоположение на карте */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <MapPin className="inline w-4 h-4 mr-1 text-blue-500" />
              Местоположение на карте (необязательно)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Кликните по карте, чтобы указать точное расположение объекта. Казахстан по центру.
            </p>
            <div className="rounded-xl overflow-hidden border border-gray-200 mb-2" style={{ height: 320 }}>
              <MapContainer
                center={[48.0196, 66.9237]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker
                  onSelect={(lat, lng) =>
                    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                  }
                />
                {form.latitude !== null && form.longitude !== null && (
                  <Marker position={[form.latitude, form.longitude]} />
                )}
              </MapContainer>
            </div>
            {form.latitude !== null && form.longitude !== null ? (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-2 border border-blue-100">
                <span className="text-sm text-blue-700 font-medium">
                  📍 {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </span>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, latitude: null, longitude: null }))}
                  className="text-xs text-red-500 hover:text-red-700 transition"
                >
                  Сбросить
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">Метка не установлена</p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Создать объект</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Информационный блок */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Советы по заполнению</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Напишите подробное описание, чтобы привлечь больше гостей</li>
            <li>• Добавьте несколько качественных фотографий вашего объекта</li>
            <li>• Установите справедливую цену в соответствии с рынком</li>
            <li>• Убедитесь, что ваша роль установлена на "Арендодатель" в профиле</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatePropertyPage;
